import { permanentRedirect } from "next/navigation";

/** A request's old address (/help/1001), from emails sent before 14 October. */
export default async function HelpRequestMoved({ params }: { params: Promise<{ number: string }> }) {
  const { number } = await params;
  permanentRedirect(/^\d+$/.test(number) ? `/support/${number}` : "/support");
}
