import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { getStoreSettings } from "@/lib/data/settings";
import { getSiteText, text } from "@/lib/site-text";

export const metadata: Metadata = { title: "Contact Us" };

const CONTACT_EMAIL_FALLBACK = "hello@yourstore.com";

export default async function ContactPage() {
  const [settings, siteText] = await Promise.all([getStoreSettings(), getSiteText()]);
  const whatsappHref = buildWhatsAppLink(
    "Hi! I'd like to get in touch.",
    settings.whatsappNumber
  );
  const contactEmail = settings.contactEmail || CONTACT_EMAIL_FALLBACK;

  return (
    <Container className="py-16">
      <div className="mx-auto max-w-lg text-center">
        <h1 className="font-serif text-4xl font-semibold text-ink">{text(siteText, "contact.heading")}</h1>
        <p className="mt-4 text-ink-soft">{text(siteText, "contact.body")}</p>
        <div className="mt-8 space-y-3">
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block rounded-full bg-[#25D366] px-8 py-3 text-sm font-medium text-white hover:opacity-90"
          >
            {text(siteText, "contact.whatsappButton")}
          </a>
          <p className="text-sm text-ink-soft">
            {text(siteText, "contact.emailIntro")}{" "}
            <a href={`mailto:${contactEmail}`} className="text-brand-600 underline-scribble">
              {contactEmail}
            </a>
          </p>
        </div>
      </div>
    </Container>
  );
}
