import { permanentRedirect } from "next/navigation";

/**
 * Help became Support (/support) on 14 October. Links to /help are in emails
 * already sent, so this forwards, keeping ?kind= (and the browser keeps any
 * #section).
 */
export default async function HelpMoved({ searchParams }: { searchParams: Promise<{ kind?: string }> }) {
  const { kind } = await searchParams;
  permanentRedirect(kind === "ticket" || kind === "suggestion" ? `/support?kind=${kind}` : "/support");
}
