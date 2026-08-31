import { cn } from "@/lib/utils";

export function TextBlock({
  heading,
  body,
  image,
  textAlign = "left",
}: {
  heading?: string;
  body?: string;
  image?: string;
  textAlign?: "left" | "center";
}) {
  if (!heading && !body && !image) return null;
  const centered = textAlign === "center";
  return (
    <div className={cn("flex flex-col gap-4", centered ? "items-center text-center" : "items-start text-left")}>
      {image && (
        // eslint-disable-next-line @next/next/no-img-element -- admin-uploaded image, arbitrary URL
        <img src={image} alt="" className="mb-2 max-h-64 w-full max-w-xl rounded-lg object-cover" />
      )}
      {heading && <h2 className="font-serif text-3xl font-semibold">{heading}</h2>}
      {body && <p className="max-w-2xl whitespace-pre-line text-ink-soft">{body}</p>}
    </div>
  );
}
