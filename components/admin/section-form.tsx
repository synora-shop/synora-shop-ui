"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { updateSectionData } from "@/app/admin/pages/actions";
import { ImageDropzone } from "@/components/admin/image-dropzone";
import { ReorderButtons } from "@/components/ui/reorder-buttons";
import type { SectionType } from "@/lib/generated/prisma/client";
import type { HeroSlide } from "@/components/storefront/sections/hero-slideshow";

type FaqItem = { question: string; answer: string };

function SingleImage({
  image,
  onChange,
}: {
  image?: string;
  onChange: (url: string) => void;
}) {
  return (
    <ImageDropzone
      images={image ? [image] : []}
      onChange={(imgs) => onChange(imgs[imgs.length - 1] ?? "")}
      folder="pages"
      label="Image"
    />
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-semibold uppercase text-ink-soft">{label}</label>
      <div className="mt-1">{children}</div>
    </div>
  );
}

export function SectionForm({
  sectionId,
  type,
  data,
  onSaved,
}: {
  sectionId: string;
  type: SectionType;
  data: unknown;
  onSaved: () => void;
}) {
  const initial = (data ?? {}) as Record<string, unknown>;
  const [heading, setHeading] = useState((initial.heading as string) ?? "");
  const [body, setBody] = useState((initial.body as string) ?? "");
  const [image, setImage] = useState((initial.image as string) ?? "");
  const [headline, setHeadline] = useState((initial.headline as string) ?? "");
  const [ctaLabel, setCtaLabel] = useState((initial.ctaLabel as string) ?? "");
  const [ctaHref, setCtaHref] = useState((initial.ctaHref as string) ?? "");
  const [imagePosition, setImagePosition] = useState<"left" | "right">(
    (initial.imagePosition as "left" | "right") ?? "left"
  );
  const [slides, setSlides] = useState<HeroSlide[]>((initial.slides as HeroSlide[]) ?? []);
  const [items, setItems] = useState<FaqItem[]>((initial.items as FaqItem[]) ?? []);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function moveSlide(from: number, to: number) {
    if (to < 0 || to >= slides.length) return;
    const next = [...slides];
    const [m] = next.splice(from, 1);
    next.splice(to, 0, m);
    setSlides(next);
  }

  function moveItem(from: number, to: number) {
    if (to < 0 || to >= items.length) return;
    const next = [...items];
    const [m] = next.splice(from, 1);
    next.splice(to, 0, m);
    setItems(next);
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    setError(null);
    let payload: object;
    switch (type) {
      case "HERO_SLIDESHOW":
        payload = { slides };
        break;
      case "BANNER":
        payload = { image, headline, ctaLabel, ctaHref };
        break;
      case "CATEGORY_GRID":
      case "FEATURED_PRODUCTS":
        payload = { heading };
        break;
      case "TEXT_BLOCK":
        payload = { heading, body, image };
        break;
      case "IMAGE_TEXT":
        payload = { heading, body, image, imagePosition };
        break;
      case "STORY":
        payload = { heading, body, ctaLabel, ctaHref };
        break;
      case "FAQ_LIST":
        payload = { heading, items };
        break;
      default:
        payload = {};
    }
    try {
      await updateSectionData(sectionId, payload);
      setSaved(true);
      onSaved();
    } catch {
      setError("Failed to save, please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {type === "HERO_SLIDESHOW" && (
        <div className="space-y-4">
          {slides.map((slide, i) => (
            <div key={i} className="space-y-3 rounded-lg border border-border p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-ink-soft">Slide {i + 1}</span>
                <div className="flex items-center gap-2">
                  <ReorderButtons index={i} count={slides.length} onMove={moveSlide} />
                  <button
                    type="button"
                    onClick={() => setSlides((prev) => prev.filter((_, idx) => idx !== i))}
                    className="rounded p-1 text-ink-soft transition-colors hover:bg-rose/10 hover:text-rose active:bg-rose/20 active:text-rose"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <SingleImage
                image={slide.image}
                onChange={(url) =>
                  setSlides((prev) => prev.map((s, idx) => (idx === i ? { ...s, image: url } : s)))
                }
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Eyebrow (small text above headline)">
                  <input
                    value={slide.eyebrow ?? ""}
                    onChange={(e) =>
                      setSlides((prev) =>
                        prev.map((s, idx) => (idx === i ? { ...s, eyebrow: e.target.value } : s))
                      )
                    }
                    className="input"
                  />
                </Field>
                <Field label="Headline">
                  <input
                    value={slide.headline ?? ""}
                    onChange={(e) =>
                      setSlides((prev) =>
                        prev.map((s, idx) => (idx === i ? { ...s, headline: e.target.value } : s))
                      )
                    }
                    className="input"
                  />
                </Field>
              </div>
              <Field label="Subheading">
                <textarea
                  value={slide.subheading ?? ""}
                  onChange={(e) =>
                    setSlides((prev) =>
                      prev.map((s, idx) => (idx === i ? { ...s, subheading: e.target.value } : s))
                    )
                  }
                  rows={2}
                  className="input"
                />
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Button label">
                  <input
                    value={slide.ctaLabel ?? ""}
                    onChange={(e) =>
                      setSlides((prev) =>
                        prev.map((s, idx) => (idx === i ? { ...s, ctaLabel: e.target.value } : s))
                      )
                    }
                    className="input"
                  />
                </Field>
                <Field label="Button link">
                  <input
                    value={slide.ctaHref ?? ""}
                    onChange={(e) =>
                      setSlides((prev) =>
                        prev.map((s, idx) => (idx === i ? { ...s, ctaHref: e.target.value } : s))
                      )
                    }
                    placeholder="/shop"
                    className="input"
                  />
                </Field>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setSlides((prev) => [...prev, { headline: "New slide" }])}
            className="flex items-center gap-1 text-sm text-brand-600"
          >
            <Plus className="h-4 w-4" /> Add Slide
          </button>
        </div>
      )}

      {type === "BANNER" && (
        <>
          <SingleImage image={image} onChange={setImage} />
          <Field label="Headline">
            <input value={headline} onChange={(e) => setHeadline(e.target.value)} className="input" />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Button label">
              <input value={ctaLabel} onChange={(e) => setCtaLabel(e.target.value)} className="input" />
            </Field>
            <Field label="Button link">
              <input
                value={ctaHref}
                onChange={(e) => setCtaHref(e.target.value)}
                placeholder="/shop"
                className="input"
              />
            </Field>
          </div>
        </>
      )}

      {(type === "CATEGORY_GRID" || type === "FEATURED_PRODUCTS") && (
        <Field label="Heading">
          <input value={heading} onChange={(e) => setHeading(e.target.value)} className="input" />
        </Field>
      )}

      {type === "TEXT_BLOCK" && (
        <>
          <Field label="Heading">
            <input value={heading} onChange={(e) => setHeading(e.target.value)} className="input" />
          </Field>
          <Field label="Body">
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} className="input" />
          </Field>
          <SingleImage image={image} onChange={setImage} />
        </>
      )}

      {type === "IMAGE_TEXT" && (
        <>
          <SingleImage image={image} onChange={setImage} />
          <Field label="Image position">
            <select
              value={imagePosition}
              onChange={(e) => setImagePosition(e.target.value as "left" | "right")}
              className="input"
            >
              <option value="left">Left</option>
              <option value="right">Right</option>
            </select>
          </Field>
          <Field label="Heading">
            <input value={heading} onChange={(e) => setHeading(e.target.value)} className="input" />
          </Field>
          <Field label="Body">
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} className="input" />
          </Field>
        </>
      )}

      {type === "STORY" && (
        <>
          <Field label="Heading">
            <input value={heading} onChange={(e) => setHeading(e.target.value)} className="input" />
          </Field>
          <Field label="Body">
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} className="input" />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Link label (optional)">
              <input value={ctaLabel} onChange={(e) => setCtaLabel(e.target.value)} className="input" />
            </Field>
            <Field label="Link href">
              <input
                value={ctaHref}
                onChange={(e) => setCtaHref(e.target.value)}
                placeholder="/about"
                className="input"
              />
            </Field>
          </div>
        </>
      )}

      {type === "FAQ_LIST" && (
        <div className="space-y-4">
          <Field label="Heading">
            <input value={heading} onChange={(e) => setHeading(e.target.value)} className="input" />
          </Field>
          {items.map((item, i) => (
            <div key={i} className="space-y-2 rounded-lg border border-border p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-ink-soft">Question {i + 1}</span>
                <div className="flex items-center gap-2">
                  <ReorderButtons index={i} count={items.length} onMove={moveItem} />
                  <button
                    type="button"
                    onClick={() => setItems((prev) => prev.filter((_, idx) => idx !== i))}
                    className="rounded p-1 text-ink-soft transition-colors hover:bg-rose/10 hover:text-rose active:bg-rose/20 active:text-rose"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <input
                value={item.question}
                onChange={(e) =>
                  setItems((prev) =>
                    prev.map((it, idx) => (idx === i ? { ...it, question: e.target.value } : it))
                  )
                }
                placeholder="Question"
                className="input"
              />
              <textarea
                value={item.answer}
                onChange={(e) =>
                  setItems((prev) =>
                    prev.map((it, idx) => (idx === i ? { ...it, answer: e.target.value } : it))
                  )
                }
                placeholder="Answer"
                rows={2}
                className="input"
              />
            </div>
          ))}
          <button
            type="button"
            onClick={() => setItems((prev) => [...prev, { question: "", answer: "" }])}
            className="flex items-center gap-1 text-sm text-brand-600"
          >
            <Plus className="h-4 w-4" /> Add Question
          </button>
        </div>
      )}

      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-full bg-brand-500 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-600 active:bg-brand-700 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save Section"}
        </button>
        {saved && !saving && <span className="text-xs text-ink-soft">Saved.</span>}
        {error && <span className="text-xs text-rose">{error}</span>}
      </div>
    </div>
  );
}
