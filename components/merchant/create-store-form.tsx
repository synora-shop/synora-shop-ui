"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createMyStore } from "@/app/merchant/actions";
import { Field, FormMessage, SubmitButton } from "@/components/merchant/form-shell";

/** A store for an account that has none (app/merchant/actions.ts createMyStore). */
export function CreateStoreForm({ platformDomain }: { platformDomain: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        start(async () => {
          const r = await createMyStore(name);
          if (!r.ok) return setError(r.error);
          router.push("/admin");
          router.refresh();
        });
      }}
      className="space-y-4"
      noValidate
    >
      <Field label="Store name" hint={`Your free address will be yourname.${platformDomain}. You can change it later.`}>
        <input name="storeName" value={name} onChange={(e) => setName(e.target.value)} required className="input" autoFocus />
      </Field>
      {error && <FormMessage tone="error">{error}</FormMessage>}
      <SubmitButton pending={pending} pendingLabel="Creating your store…">
        Create my store
      </SubmitButton>
    </form>
  );
}
