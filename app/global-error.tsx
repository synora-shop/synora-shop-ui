"use client";

/**
 * The last resort, for a failure in the root layout itself — where no other
 * error page can draw, because they all sit inside it. Has to bring its own
 * <html> and <body> for the same reason.
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", color: "#121212", background: "#fff" }}>
        <div style={{ maxWidth: 480, margin: "0 auto", padding: "96px 16px", textAlign: "center" }}>
          <h1 style={{ fontSize: 28, fontWeight: 600, margin: 0 }}>Something went wrong</h1>
          <p style={{ marginTop: 12, fontSize: 16, lineHeight: 1.5, opacity: 0.75 }}>Trying again usually fixes it.</p>
          <button
            type="button"
            onClick={reset}
            style={{ marginTop: 24, padding: "12px 24px", borderRadius: 999, border: 0, background: "#121212", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
          >
            Try again
          </button>
          {error.digest && <p style={{ marginTop: 24, fontSize: 11, opacity: 0.5, fontFamily: "monospace" }}>Reference: {error.digest}</p>}
        </div>
      </body>
    </html>
  );
}
