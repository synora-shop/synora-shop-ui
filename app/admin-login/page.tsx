import { Suspense } from "react";
import { Container } from "@/components/ui/container";
import { AdminLoginForm } from "@/components/admin/admin-login-form";

// Deliberately NOT nested under app/admin/ — that segment's layout.tsx redirects
// unauthenticated visitors to this very page, which would loop if this page lived
// inside it. Keep this route standalone.
export default function AdminLoginPage() {
  return (
    <Container className="py-16">
      <div className="mx-auto max-w-sm">
        <h1 className="font-serif text-3xl font-semibold text-ink">Admin sign in</h1>
        <p className="mt-2 text-sm text-ink-soft">Company/staff access only.</p>
        <Suspense fallback={null}>
          <AdminLoginForm />
        </Suspense>
      </div>
    </Container>
  );
}
