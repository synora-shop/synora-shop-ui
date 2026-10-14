"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, BellRing, Bug, Check, ChevronRight, Lightbulb, Loader2, Send } from "lucide-react";
import { replyToHelpRequest, setHelpNotify, submitHelpRequest } from "@/app/(platform)/support/actions";
import { LIMITS, TOPICS, STATUS_TONE, isClosed, ref, statusLabel, type HelpKindName, type HelpStatusName } from "@/lib/help";
import { formatRelativeTime } from "@/lib/format-relative-time";
import type { SearchItem } from "@/components/platform/help-search";

/**
 * The interactive parts of /support (14 October): writing to the team, the list
 * of what you have sent, the "email me" switch and the reply box.
 */

/* ------------------------------------------------------------- the switch -- */

/** "Email me about this": a real switch, saved the moment it is flipped. */
export function NotifySwitch({ number, initial, label = true }: { number: number; initial: boolean; label?: boolean }) {
  const [on, setOn] = useState(initial);
  const [pending, start] = useTransition();
  const flip = () => {
    const next = !on;
    setOn(next);
    start(async () => {
      const r = await setHelpNotify(number, next);
      if (!r.ok) setOn(!next);
    });
  };
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={`Email me about ${ref(number)}`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        flip();
      }}
      disabled={pending}
      className="inline-flex items-center gap-2.5 text-[13px] font-semibold text-[#0d0d50]/70"
    >
      <span className={`relative h-6 w-10 shrink-0 rounded-full transition-colors ${on ? "bg-[#6666ff]" : "bg-[#0d0d50]/15"}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-[left] ${on ? "left-[18px]" : "left-0.5"}`} />
      </span>
      {label && (on ? "Emailing me updates" : "Updates off")}
    </button>
  );
}

/* ------------------------------------------------------------- composing -- */

const KINDS: { kind: HelpKindName; title: string; text: string; icon: typeof Bug }[] = [
  { kind: "TICKET", title: "Report a problem", text: "Something broken, confusing or stuck.", icon: Bug },
  { kind: "SUGGESTION", title: "Suggest an idea", text: "Something that would make running your shop easier.", icon: Lightbulb },
];

export function HelpComposer({
  initialKind,
  shops,
  docs,
}: {
  initialKind: HelpKindName;
  shops: { id: string; name: string }[];
  docs: SearchItem[];
}) {
  const router = useRouter();
  const [kind, setKind] = useState<HelpKindName>(initialKind);
  const [topic, setTopic] = useState<string>("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [shopId, setShopId] = useState(shops[0]?.id ?? "");
  const [notify, setNotify] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<{ number: number; emailFailed?: boolean } | null>(null);
  const [pending, start] = useTransition();

  // Before they finish typing: the docs that might already answer it.
  const hints = useMemo(() => {
    if (kind !== "TICKET") return [];
    const words = `${subject}`.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 3);
    if (words.length === 0) return [];
    return docs
      .map((d) => {
        const hay = `${d.title} ${d.text}`.toLowerCase();
        return { d, s: words.filter((w) => hay.includes(w)).length };
      })
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 3)
      .map((x) => x.d);
  }, [subject, kind, docs]);

  if (sent) {
    return (
      <div className="rounded-[1.75rem] bg-[linear-gradient(140deg,#f3f3ff_0%,#eef8ff_60%,#effcf6_100%)] p-7 sm:p-9">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-[#b8efd6] text-[#0f5c3e]">
          <Check className="h-6 w-6" />
        </span>
        <h3 className="mt-5 text-[1.6rem] font-semibold tracking-[-0.03em]">
          Sent. It&rsquo;s {ref(sent.number)}.
        </h3>
        <p className="mt-2 max-w-lg text-[17px] leading-[1.7] text-[#0d0d50]/75">
          {kind === "TICKET" ? "Someone on the Synora team will pick it up." : "The team reads every idea."}{" "}
          {notify ? "We'll email you when there's a reply or it moves along." : "Check back here for replies."}
          {sent.emailFailed && " (The confirmation email didn't go out, but your request is saved.)"}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href={`/support/${sent.number}`} className="inline-flex h-11 items-center gap-2 rounded-full bg-[#6666ff] px-5 text-sm font-semibold text-white hover:bg-[#5a5af5]">
            Open {ref(sent.number)} <ArrowRight className="h-4 w-4" />
          </Link>
          <button
            type="button"
            onClick={() => {
              setSent(null);
              setSubject("");
              setBody("");
              setTopic("");
            }}
            className="inline-flex h-11 items-center rounded-full bg-white px-5 text-sm font-semibold text-[#0d0d50] ring-1 ring-[#0d0d50]/10"
          >
            Send another
          </button>
        </div>
      </div>
    );
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    start(async () => {
      const r = await submitHelpRequest({ kind, topic: topic || "Something else", subject, body, shopId, notify });
      if (!r.ok) return setError(r.error);
      setSent({ number: r.number!, emailFailed: r.emailFailed });
      router.refresh();
    });
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-7">
      {/* What kind. */}
      <fieldset>
        <legend className="mb-3 text-[15px] font-semibold">What would you like to do?</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {KINDS.map(({ kind: k, title, text, icon: Icon }) => {
            const on = kind === k;
            return (
              <label
                key={k}
                className={`relative flex cursor-pointer gap-4 rounded-[1.4rem] border-2 p-5 transition-colors ${
                  on ? "border-[#6666ff] bg-[#f5f5ff]" : "border-[#0d0d50]/[0.08] hover:border-[#0d0d50]/20"
                }`}
              >
                <input type="radio" name="kind" value={k} checked={on} onChange={() => setKind(k)} className="sr-only" />
                <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${on ? "bg-[#6666ff] text-white" : "bg-[#f2f2ff] text-[#6666ff]"}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <span>
                  <span className="block text-[16px] font-semibold">{title}</span>
                  <span className="mt-0.5 block text-[14px] leading-snug text-[#0d0d50]/60">{text}</span>
                </span>
                {on && (
                  <span className="absolute right-4 top-4 grid h-5 w-5 place-items-center rounded-full bg-[#6666ff] text-white">
                    <Check className="h-3 w-3" />
                  </span>
                )}
              </label>
            );
          })}
        </div>
      </fieldset>

      {/* About what. */}
      <fieldset>
        <legend className="mb-3 text-[15px] font-semibold">
          What is it about? <span className="font-normal text-[#0d0d50]/45">Optional</span>
        </legend>
        <div className="flex flex-wrap gap-2">
          {TOPICS.map((t) => {
            const on = topic === t;
            return (
              <button
                key={t}
                type="button"
                aria-pressed={on}
                onClick={() => setTopic(on ? "" : t)}
                className={`h-9 rounded-full px-4 text-[14px] font-medium transition-colors ${on ? "bg-[#0d0d50] text-white" : "bg-[#f2f2ff] text-[#0d0d50]/75 hover:bg-[#e8e8ff]"}`}
              >
                {t}
              </button>
            );
          })}
        </div>
      </fieldset>

      {shops.length > 1 && (
        <label className="block">
          <span className="mb-2 block text-[15px] font-semibold">Which shop?</span>
          <select value={shopId} onChange={(e) => setShopId(e.target.value)} className="desk-field h-12">
            {shops.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
      )}

      <label className="block">
        <span className="mb-2 block text-[15px] font-semibold">{kind === "TICKET" ? "In a few words, what's wrong?" : "In a few words, what's the idea?"}</span>
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          maxLength={LIMITS.subject}
          placeholder={kind === "TICKET" ? "JazzCash payments aren't showing as paid" : "Let customers pick a delivery time"}
          className="desk-field h-12"
        />
      </label>

      {hints.length > 0 && (
        <div className="-mt-3 rounded-2xl bg-[#f5f5ff] p-4">
          <p className="text-[13px] font-semibold text-[#4b4bea]">These might already answer it</p>
          <ul className="mt-2 flex flex-col">
            {hints.map((h) => (
              <li key={`${h.href}${h.title}${h.text}`}>
                <a href={h.href} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-3 rounded-xl px-2 py-2 text-[14px] hover:bg-white">
                  <span className="min-w-0">
                    <span className="font-semibold">{h.title}</span> <span className="text-[#0d0d50]/55">{h.text.slice(0, 80)}</span>
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-[#0d0d50]/35" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <label className="block">
        <span className="mb-2 block text-[15px] font-semibold">{kind === "TICKET" ? "Tell us what happened" : "Tell us more"}</span>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={LIMITS.body}
          rows={6}
          placeholder={kind === "TICKET" ? "What did you do, what did you expect, and what happened instead?" : "What would it let you do, and how do you manage without it today?"}
          className="desk-field min-h-[10rem] resize-y py-3 leading-relaxed"
        />
      </label>

      <div className="flex items-start gap-3 rounded-2xl border border-[#0d0d50]/[0.08] p-4">
        <BellRing className="mt-0.5 h-5 w-5 shrink-0 text-[#6666ff]" />
        <div className="flex-1">
          <p className="text-[15px] font-semibold">Notify me</p>
          <p className="text-[14px] leading-snug text-[#0d0d50]/60">
            {kind === "TICKET" ? "Email me when the team replies or my ticket's status changes." : "Email me when my suggestion is being considered, planned or shipped."}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={notify}
          aria-label="Notify me"
          onClick={() => setNotify(!notify)}
          className={`relative mt-1 h-6 w-10 shrink-0 rounded-full transition-colors ${notify ? "bg-[#6666ff]" : "bg-[#0d0d50]/15"}`}
        >
          <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-[left] ${notify ? "left-[18px]" : "left-0.5"}`} />
        </button>
      </div>

      {error && (
        <p role="alert" className="rounded-2xl border border-[#c2410c]/25 bg-[#fff4ee] px-4 py-3 text-[15px] text-[#7c2d12]">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-12 items-center justify-center gap-2 self-start rounded-full bg-[#6666ff] px-7 text-[15px] font-semibold text-white shadow-[0_12px_30px_-12px_rgba(102,102,255,0.8)] transition-[transform,background-color] hover:-translate-y-0.5 hover:bg-[#5a5af5] disabled:translate-y-0 disabled:opacity-60"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        {kind === "TICKET" ? "Send ticket" : "Send suggestion"}
      </button>
    </form>
  );
}

/* --------------------------------------------------------------- history -- */

export type HistoryRow = {
  number: number;
  kind: HelpKindName;
  status: HelpStatusName;
  subject: string;
  updatedAt: string;
  notify: boolean;
  unread: boolean;
};

/**
 * Everything the person has sent. In the help page's side panel: tight rows
 * (status, a dot for an unread reply) and the first few, with the rest a tap
 * away. The "email me" switch lives on each request's own page.
 */
export function HelpHistory({ rows }: { rows: HistoryRow[] }) {
  const [tab, setTab] = useState<"ALL" | HelpKindName>("ALL");
  const [all, setAll] = useState(false);
  const matching = rows.filter((r) => tab === "ALL" || r.kind === tab);
  const shown = all ? matching : matching.slice(0, 6);
  const tabs: [typeof tab, string, number][] = [
    ["ALL", "All", rows.length],
    ["TICKET", "Tickets", rows.filter((r) => r.kind === "TICKET").length],
    ["SUGGESTION", "Ideas", rows.filter((r) => r.kind === "SUGGESTION").length],
  ];

  return (
    <div>
      <div role="tablist" aria-label="Show" className="grid grid-cols-3 rounded-full bg-[#f2f2f7] p-1">
        {tabs.map(([id, label, n]) => (
          <button
            key={id}
            role="tab"
            type="button"
            aria-selected={tab === id}
            onClick={() => {
              setTab(id);
              setAll(false);
            }}
            className={`inline-flex h-8 items-center justify-center gap-1 rounded-full text-[13px] font-semibold transition-all ${
              tab === id ? "bg-white text-[#0d0d50] shadow-[0_2px_8px_-3px_rgba(13,13,80,0.25)]" : "text-[#0d0d50]/55"
            }`}
          >
            {label} <span className="text-[11.5px] opacity-55">{n}</span>
          </button>
        ))}
      </div>

      {matching.length === 0 ? (
        <p className="mt-4 rounded-2xl bg-[#f7f7fb] px-4 py-7 text-center text-[14.5px] leading-relaxed text-[#0d0d50]/55">
          {rows.length === 0 ? "Nothing sent yet. What you send shows here, with where it's up to." : "Nothing here yet."}
        </p>
      ) : (
        <ul className="mt-3 flex flex-col">
          {shown.map((r) => (
            <li key={r.number}>
              <Link href={`/support/${r.number}`} className="group flex items-center gap-3 rounded-2xl px-2.5 py-3 transition-colors hover:bg-[#f5f5fb]">
                <span className={`relative grid h-9 w-9 shrink-0 place-items-center rounded-xl ${r.kind === "TICKET" ? "bg-[#ecebff] text-[#6666ff]" : "bg-[#e4f7ee] text-[#1d7a52]"}`}>
                  {r.kind === "TICKET" ? <Bug className="h-4 w-4" /> : <Lightbulb className="h-4 w-4" />}
                  {r.unread && <span aria-label="New reply" className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full bg-[#ff5a5f] ring-2 ring-white" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className={`block truncate text-[14.5px] font-semibold ${isClosed(r.status) ? "text-[#0d0d50]/55" : "text-[#0d0d50]"}`}>{r.subject}</span>
                  <span className="block text-[12.5px] text-[#0d0d50]/45">
                    {ref(r.number)} · {r.unread ? <b className="font-semibold text-[#ff5a5f]">new reply</b> : formatRelativeTime(r.updatedAt)}
                  </span>
                </span>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11.5px] font-semibold ${STATUS_TONE[r.status]}`}>{statusLabel(r.kind, r.status)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {matching.length > 6 && (
        <button type="button" onClick={() => setAll(!all)} className="mt-1 w-full rounded-xl py-2 text-[13.5px] font-semibold text-[#4b4bea] hover:bg-[#f5f5ff]">
          {all ? "Show fewer" : `Show all ${matching.length}`}
        </button>
      )}
    </div>
  );
}

/* ----------------------------------------------------------------- reply -- */

export function ReplyBox({ number, closed }: { number: number; closed: boolean }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        start(async () => {
          const r = await replyToHelpRequest(number, text);
          if (!r.ok) return setError(r.error);
          setText("");
          router.refresh();
        });
      }}
      className="rounded-[1.4rem] border border-[#0d0d50]/10 bg-white p-2 shadow-[0_14px_40px_-26px_rgba(13,13,80,0.4)] focus-within:border-[#6666ff]"
    >
      <label htmlFor="help-reply" className="sr-only">
        Reply
      </label>
      <textarea
        id="help-reply"
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        maxLength={LIMITS.reply}
        placeholder={closed ? "Still a problem? Reply and it opens again." : "Write a reply to the team"}
        className="min-h-[6rem] w-full resize-y bg-transparent px-3 py-2 text-[16px] leading-relaxed outline-none placeholder:text-[#0d0d50]/35"
      />
      <div className="flex items-center justify-between gap-3 px-2 pb-1">
        <span className="text-[13px] text-[#c2410c]" role="alert">
          {error}
        </span>
        <button
          type="submit"
          disabled={pending || text.trim().length < 2}
          className="inline-flex h-10 items-center gap-2 rounded-full bg-[#6666ff] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#5a5af5] disabled:opacity-50"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send
        </button>
      </div>
    </form>
  );
}
