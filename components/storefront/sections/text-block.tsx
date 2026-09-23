import { cn } from "@/lib/utils";
import { SectionImage } from "@/components/storefront/section-image";

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
        // Sized by the layout rather than filling a box — `max-h-64 w-full
        // max-w-xl` is the image's own shape, and `fill` here would stretch it
        // across the whole text column. Width and height are the aspect it is
        // generated at; the classes still decide what it is drawn at.
        <div className="mb-2 w-full max-w-xl">
          <SectionImage
            src={image}
            alt=""
            className="max-h-64 w-full rounded-lg object-cover"
            width={1152}
            height={648}
          />
        </div>
      )}
      {heading && <h2 className="font-serif text-3xl font-semibold">{heading}</h2>}
      {body && <p className="max-w-2xl whitespace-pre-line text-ink-soft">{body}</p>}
    </div>
  );
}
