"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2, ShieldAlert, ShieldCheck, Trash2, UploadCloud } from "lucide-react";
import { uploadFont, deleteFont, renameFont } from "@/app/admin/fonts/actions";
import { saveThemeTokens } from "@/app/admin/theme/actions";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { SaveButton, type SaveState } from "@/components/ui/save-button";
import { ACCEPTED_FONT_EXTENSIONS, FONT_SECURITY_NOTE } from "@/lib/font-validation";
import { CUSTOM_FONT_PREFIX, FONT_STACKS, type ThemeTokens } from "@/lib/theme-tokens";

type FontRow = {
  id: string;
  name: string;
  url: string;
  format: string;
  sizeBytes: number;
  scanStatus: string;
  scanProvider: string;
  scanDetail: string;
};

function formatSize(bytes: number) {
  return bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/** Built-in families plus everything uploaded, as one picker list. */
function FontSelect({
  value,
  fonts,
  onChange,
}: {
  value: string;
  fonts: FontRow[];
  onChange: (value: string) => void;
}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="input h-9 text-sm">
      <optgroup label="Built in">
        {Object.entries(FONT_STACKS).map(([key, { label }]) => (
          <option key={key} value={key}>
            {label}
          </option>
        ))}
      </optgroup>
      {fonts.length > 0 && (
        <optgroup label="Uploaded">
          {fonts.map((f) => (
            <option key={f.id} value={`${CUSTOM_FONT_PREFIX}${f.id}`}>
              {f.name}
            </option>
          ))}
        </optgroup>
      )}
    </select>
  );
}

/** Shows what actually happened to a file, rather than implying a blanket guarantee. */
function ScanBadge({ font }: { font: FontRow }) {
  if (font.scanStatus === "clean") {
    return (
      <span
        title={`${font.scanDetail} (${font.scanProvider})`}
        className="inline-flex items-center gap-1 rounded-full bg-green-bg px-2 py-0.5 text-[10px] font-medium text-green"
      >
        <ShieldCheck className="h-3 w-3" /> Scanned clean
      </span>
    );
  }
  return (
    <span
      title={font.scanDetail || "No malware scanner was configured when this was uploaded."}
      className="inline-flex items-center gap-1 rounded-full bg-amber-bg px-2 py-0.5 text-[10px] font-medium text-amber"
    >
      <ShieldAlert className="h-3 w-3" /> Not scanned
    </span>
  );
}

export function FontsManager({
  fonts,
  tokens,
  scanEnabled,
}: {
  fonts: FontRow[];
  tokens: ThemeTokens;
  scanEnabled: boolean;
}) {
  const router = useRouter();
  const { confirm, dialog } = useConfirm();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [headingFont, setHeadingFont] = useState(tokens.headingFont);
  const [bodyFont, setBodyFont] = useState(tokens.bodyFont);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const dirty = headingFont !== tokens.headingFont || bodyFont !== tokens.bodyFont;

  async function handleFile(file: File) {
    setUploading(true);
    setError(null);
    const formData = new FormData();
    formData.set("file", file);
    const result = await uploadFont(formData);
    setUploading(false);
    if (result.error) setError(result.error);
    else router.refresh();
  }

  async function handleDelete(font: FontRow) {
    const ok = await confirm({
      title: `Delete "${font.name}"?`,
      description: "The font file is removed permanently.",
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    const result = await deleteFont(font.id);
    if (result.error) setError(result.error);
    else router.refresh();
  }

  async function handleSaveSelection() {
    setSaveState("saving");
    try {
      await saveThemeTokens({ ...tokens, headingFont, bodyFont });
      setSaveState("saved");
      router.refresh();
    } catch {
      setSaveState("error");
    }
  }

  return (
    <div className="space-y-10">
      {dialog}

      <section>
        <h2 className="font-serif text-lg font-semibold">Which fonts the store uses</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Applies to your whole store.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
              Primary, headings
            </label>
            <div className="mt-1">
              <FontSelect value={headingFont} fonts={fonts} onChange={setHeadingFont} />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
              Secondary, body text
            </label>
            <div className="mt-1">
              <FontSelect value={bodyFont} fonts={fonts} onChange={setBodyFont} />
            </div>
          </div>
        </div>
        <div className="mt-4">
          <SaveButton
            state={dirty ? (saveState === "saving" ? "saving" : "idle") : saveState}
            onClick={handleSaveSelection}
            idleLabel="Save font choices"
          />
        </div>
      </section>

      <section>
        <h2 className="font-serif text-lg font-semibold">Upload a font</h2>

        <label
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const file = e.dataTransfer.files?.[0];
            if (file) handleFile(file);
          }}
          className="mt-3 flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-border px-4 py-8 text-center text-sm text-ink-soft transition-colors hover:bg-subtle active:bg-subtle"
        >
          {uploading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin text-brand-500" />
              <span>Checking and uploading…</span>
            </>
          ) : (
            <>
              <UploadCloud className="h-5 w-5 text-brand-500" />
              <span>
                Drop a font here, or <span className="text-brand-600 underline-scribble">browse</span>
              </span>
              <span className="text-xs">{ACCEPTED_FONT_EXTENSIONS.join(" · ")}, up to 2 MB</span>
            </>
          )}
          <input
            ref={fileRef}
            type="file"
            accept={ACCEPTED_FONT_EXTENSIONS.join(",")}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
              e.target.value = "";
            }}
          />
        </label>

        <p className="mt-3 flex items-start gap-2 rounded-lg bg-subtle p-3 text-xs leading-snug text-ink-soft">
          {scanEnabled ? (
            <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-green" />
          ) : (
            <ShieldAlert className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber" />
          )}
          <span>
            {FONT_SECURITY_NOTE}
            <br />
            {scanEnabled ? (
              <>
                <strong className="text-green">Malware scanning is on.</strong> Every upload is checked
                against ~70 antivirus engines via VirusTotal, and anything flagged is rejected.
              </>
            ) : (
              <>
                <strong className="text-amber">Malware scanning is off.</strong> Set{" "}
                <code className="rounded bg-white px-1">VIRUSTOTAL_API_KEY</code> to check uploads
                against ~70 antivirus engines.
              </>
            )}
          </span>
        </p>

        {error && (
          <p className="mt-3 flex items-start gap-1.5 text-sm text-rose">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            {error}
          </p>
        )}
      </section>

      <section>
        <h2 className="font-serif text-lg font-semibold">Your fonts</h2>
        {fonts.length === 0 ? (
          <p className="mt-3 rounded-lg border border-dashed border-border p-6 text-center text-sm text-ink-soft">
            Nothing uploaded yet.
          </p>
        ) : (
          <div className="mt-3 divide-y divide-border rounded-lg border border-border bg-white">
            {fonts.map((font) => (
              <div key={font.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <input
                    defaultValue={font.name}
                    onBlur={(e) => {
                      const next = e.target.value.trim();
                      if (next && next !== font.name) renameFont(font.id, next).then(() => router.refresh());
                    }}
                    className="w-full rounded border border-transparent bg-transparent px-1 py-0.5 text-sm font-medium transition-colors hover:border-border focus:border-brand-300 focus:outline-none"
                  />
                  <p className="flex flex-wrap items-center gap-2 px-1 text-xs text-ink-soft">
                    <span>
                      {font.format.toUpperCase()} · {formatSize(font.sizeBytes)}
                    </span>
                    <ScanBadge font={font} />
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(font)}
                  aria-label={`Delete ${font.name}`}
                  className="rounded p-1.5 text-ink-soft transition-colors hover:bg-rose/10 hover:text-rose active:bg-rose/20"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
