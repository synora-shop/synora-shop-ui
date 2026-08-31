"use server";

import { put } from "@vercel/blob";
import { requireRole } from "@/lib/auth-guard";
import { scanBuffer, scanPolicyBlocks } from "@/lib/virus-scan";
import { imageStorageKey, validateImageFile } from "@/lib/image-validation";

async function requireAdmin() {
  await requireRole("STAFF");
}

// Shared image upload used by every admin image field (products, categories,
// homepage sections, etc.) — pass a `folder` to keep Blob storage tidy and to
// make it obvious in the dashboard what an image belongs to.
export async function uploadImage(
  formData: FormData,
  folder: string
): Promise<{ url: string } | { error: string }> {
  await requireAdmin();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "No file provided." };

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return { error: "Image upload isn't configured yet, paste an image URL instead." };
  }

  const bytes = new Uint8Array(await file.arrayBuffer());

  // Believe the bytes, not the name and not the browser. The only filter this
  // had was `file.type.startsWith("image/")` in the client, which is a hint
  // from whoever is uploading — so anything at all could be stored, at any
  // size, and served publicly from the platform's own blob domain. SVG comes
  // back sanitised rather than as it arrived.
  const checked = validateImageFile(bytes, file.name);
  if (!checked.ok) return { error: checked.error };

  // Product photos go through the same malware check as fonts and icons.
  // Scanning is hash-first, so re-uploading a photo already seen costs one
  // cheap lookup; and with no scanner configured this is a no-op that leaves
  // the existing upload flow exactly as it was.
  const verdict = await scanBuffer(checked.bytes, file.name);
  const blocked = scanPolicyBlocks(verdict);
  if (blocked) return { error: blocked };

  try {
    // The key is built from the detected format, not the supplied filename —
    // which used to put a merchant-controlled string into a public URL on our
    // own domain, and let a file be stored under an extension it wasn't.
    const blob = await put(imageStorageKey(folder, checked.format), Buffer.from(checked.bytes), {
      access: "public",
    });
    return { url: blob.url };
  } catch {
    return { error: "Upload failed, paste an image URL instead." };
  }
}
