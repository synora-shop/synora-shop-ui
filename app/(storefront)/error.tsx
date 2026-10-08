"use client";

import { StoreLink as Link } from "@/components/storefront/store-link";

/**
 * A storefront page that failed, as a customer sees it.
 *
 * There was none, so a customer got Next's bare "Application error: a
 * client-side exception has occurred" — on somebody's shop. Plain on purpose:
 * the storefront's look is the merchant's, and an error page in the admin's
 * colours would be ours. No details — production hides them anyway — but the
 * reference, which is what finds it in the logs.
 */
export default function StorefrontError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div style={{ maxWidth: 480, margin: "0 auto", padding: "96px 16px", textAlign: "center", fontFamily: "inherit" }}>
      <h1 style={{ fontSize: 28, lineHeight: 1.2, fontWeight: 600, margin: 0 }}>This page didn&rsquo;t load</h1>
      <p style={{ marginTop: 12, fontSize: 16, lineHeight: 1.5, opacity: 0.75 }}>
        Something went wrong on our side. Trying again usually fixes it.
      </p>
      <div style={{ marginTop: 24, display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={reset}
          style={{ padding: "12px 24px", borderRadius: 999, border: 0, background: "#121212", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
        >
          Try again
        </button>
        <Link href="/" style={{ padding: "12px 24px", borderRadius: 999, border: "1px solid currentColor", fontSize: 14, fontWeight: 600, color: "inherit", textDecoration: "none" }}>
          Go to the home page
        </Link>
      </div>
      {error.digest && <p style={{ marginTop: 24, fontSize: 11, opacity: 0.5, fontFamily: "monospace" }}>Reference: {error.digest}</p>}
    </div>
  );
}
