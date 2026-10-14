"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Mail, MessageSquare, Send } from "lucide-react";
import { answerHelpRequest } from "@/app/synora/actions";
import { LIMITS, statusLabel, type HelpKindName, type HelpStatusName } from "@/lib/help";

/**
 * The team's reply (14 October): write, choose how it reaches the merchant
 * (in their Synora ticket, or by email), and optionally move the status in
 * the same step. Says up front whether they will be emailed.
 */
export function AnswerBox({ number, kind, status, statuses, notify, email }: { number: number; kind: HelpKindName; status: HelpStatusName; statuses: HelpStatusName[]; notify: boolean; email: string }) {
  const router = useRouter();
  const [via, setVia] = useState<"thread" | "email">("thread");
  const [body, setBody] = useState("");
  const [next, setNext] = useState<HelpStatusName | "">("");
  const [msg, setMsg] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [pending, start] = useTransition();

  const reach =
    via === "email"
      ? `Goes to ${email} as an email, and is kept in the ticket.`
      : notify
        ? `Shows in their ticket, and ${email} is emailed about it.`
        : "Shows in their ticket. They turned emails off, so they will see it next time they look.";

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setMsg(null);
        start(async () => {
          const r = await answerHelpRequest({ number, body, via, statusTo: next });
          if (!r.ok) return setMsg({ tone: "error", text: r.error });
          setBody("");
          setNext("");
          setMsg({ tone: "ok", text: r.emailFailed ? "Saved, but the email didn't go out. Try again, or reply in the ticket." : "Sent." });
          router.refresh();
        });
      }}
      className="rounded-[1.6rem] bg-white p-5 ring-1 ring-[#0d0d50]/[0.08]"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="radiogroup" aria-label="Reply by" className="inline-flex rounded-full bg-[#f2f2ff] p-1">
          {(
            [
              ["thread", "Reply in ticket", MessageSquare],
              ["email", "Reply by email", Mail],
            ] as const
          ).map(([id, label, Icon]) => (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={via === id}
              onClick={() => setVia(id)}
              className={`inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-[13.5px] font-semibold transition-all ${
                via === id ? "bg-white text-[#4b4bea] shadow-[0_2px_10px_-3px_rgba(13,13,80,0.25)]" : "text-[#0d0d50]/60"
              }`}
            >
              <Icon className="h-4 w-4" /> {label}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-[13.5px] font-semibold text-[#0d0d50]/70">
          Status
          <select
            value={next}
            onChange={(e) => setNext(e.target.value as HelpStatusName | "")}
            className="h-9 rounded-full bg-[#f2f2ff] px-3 text-[13.5px] font-semibold text-[#0d0d50] outline-none focus:ring-2 focus:ring-[#6666ff]"
          >
            <option value="">Keep: {statusLabel(kind, status)}</option>
            {statuses
              .filter((s) => s !== status)
              .map((s) => (
                <option key={s} value={s}>
                  {statusLabel(kind, s)}
                </option>
              ))}
          </select>
        </label>
      </div>

      <label htmlFor="team-answer" className="sr-only">
        Reply
      </label>
      <textarea
        id="team-answer"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={5}
        maxLength={LIMITS.reply}
        placeholder={via === "email" ? "Write the email" : "Write a reply"}
        className="desk-field mt-4 min-h-[8rem] resize-y py-3 leading-relaxed"
      />
      <p className="mt-2 text-[13px] text-[#0d0d50]/55">{reach}</p>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <span role="status" className={`text-[13.5px] font-medium ${msg?.tone === "error" ? "text-[#c2410c]" : "text-[#1d7a52]"}`}>
          {msg?.text}
        </span>
        <button
          type="submit"
          disabled={pending || (!body.trim() && !next)}
          className="inline-flex h-11 items-center gap-2 rounded-full bg-[#6666ff] px-6 text-[14.5px] font-semibold text-white transition-colors hover:bg-[#5a5af5] disabled:opacity-50"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : via === "email" ? <Mail className="h-4 w-4" /> : <Send className="h-4 w-4" />}
          {!body.trim() && next ? "Change status" : via === "email" ? "Send email" : "Send reply"}
        </button>
      </div>
    </form>
  );
}
