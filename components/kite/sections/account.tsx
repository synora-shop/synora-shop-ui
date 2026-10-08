"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { kitAddAddress, kitDeleteAddress } from "@/lib/themes/kit-actions";
import { ktx } from "@/components/kite/text";
import { KiteButton, KiteField, KiteSelect } from "@/components/kite/ui";
import { cn } from "@/lib/utils";
import { fill, str, type KiteContext } from "@/components/kite/contract";
import { kt } from "@/components/kite/type";
import { kiteMoney } from "@/components/kite/money";
import { KitePieceCard } from "@/components/kite/piece-card";
import { WHOLE, isFilePhoto } from "@/components/kite/assets";

type Tab = "contact" | "saved" | "orders";

/** A field as the file draws it: the label at 80%, the value 31 down, a rule at 67. */
function Field({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={cn("relative h-[calc(67*var(--u))]", wide ? "w-full" : "w-full md:w-[calc(384*var(--u))]")}>
      <p {...kt("sans", 16)} className={cn(kt("sans", 16).className, "opacity-80")}>{label}</p>
      <p {...kt("sans", 20)} className={cn(kt("sans", 20).className, "absolute left-0 top-[calc(31*var(--u))] w-[calc(300*var(--u))] truncate")}>{value}</p>
      <span aria-hidden className="absolute inset-x-0 top-[calc(66.5*var(--u))] h-px bg-[#f4f3f1]" />
    </div>
  );
}

/** EDIT, CHANGE, REMOVE, VIEW, RATE: SF Pro Light 20, underlined, at half ink. */
function Dim({ children, href, onClick, pressed }: { children: React.ReactNode; href?: string; onClick?: () => void; pressed?: boolean }) {
  const props = { ...kt("sans", 20), className: cn(kt("sans", 20).className, "underline", pressed ? "opacity-100" : "opacity-50 hover:opacity-100") };
  return href ? <a href={href} {...props}>{children}</a> : <button type="button" aria-expanded={pressed} onClick={onClick} {...props}>{children}</button>;
}

/**
 * The account — "Account | Contact Information", "| Saved Items", "| Order
 * History" and "Mobile | Account" in the file.
 *
 * Desktop (the 966 under the header): the portrait, 864x966, at the left;
 * on it at 32,686 the greeting in the serif 96, the words at 20 (425 wide),
 * 32 below, the three tabs in SF Pro Light 20 capitals, underlined, 32 apart
 * — the open one in the ink, the others at half. At the right from 896, the
 * open tab's heading in Khand 32 at y 32, its contents from y 113:
 *   details   two columns of 384, 32 apart: name and email, EDIT under them
 *             at the right; then phone, and city, address and postal code
 *             99 apart, CHANGE and REMOVE under them at the right
 *   saved     each group's name in Khand 32, its pieces 292 wide and 32
 *             apart in a row to swipe, 32 between groups
 *   orders    rows 99 apart: the date at 80%, the reference and the total
 *             on a 500 line, VIEW and RATE at the right
 *
 * Phone (the 849 under the header): the greeting in the serif 64, the words
 * at 14, the tabs at 14 spread evenly — saved items first, as the file has
 * them — then from 291 the open tab. The file draws the saved tab only; the
 * details and orders are the desktop's, one column in the phone's margin
 * (decided 8 October, to replace when drawn).
 */
export function KiteAccount({ data, ctx }: { data: Record<string, unknown>; ctx: KiteContext }) {
  const [tab, setTab] = useState<Tab>(ctx.accountTab === "orders" ? "orders" : ctx.accountTab === "saved" ? "saved" : "contact");
  const router = useRouter();
  // EDIT, CHANGE and REMOVE do what they say (they did nothing until
  // 8 October). Details are changed by asking the shop — the platform's rule
  // — so EDIT says so; CHANGE opens the address as a form and saves it as the
  // main address; REMOVE deletes it. The reference build keeps its changes in
  // the page.
  const [editNote, setEditNote] = useState(false);
  const [changing, setChanging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState({ line1: "", city: "", postcode: "" });
  const [local, setLocal] = useState<NonNullable<KiteContext["customer"]>["addresses"] | null>(null);
  const me = ctx.customer;
  if (!me) return null;
  const addresses = local ?? me.addresses;
  const main = addresses.find((a) => a.main) ?? addresses[0];
  const startChange = () => {
    setDraft({ line1: main?.parts?.line1 ?? main?.lines[0] ?? "", city: main?.parts?.city ?? "", postcode: main?.parts?.postcode ?? "" });
    setChanging((v) => !v);
  };
  const save = async () => {
    if (!draft.line1.trim() || !draft.city.trim()) return;
    if (!ctx.live) {
      setLocal([{ id: "home", label: "Home", lines: [draft.line1, `${draft.city} ${draft.postcode}`.trim()], main: true, parts: draft }]);
      return setChanging(false);
    }
    setBusy(true);
    await kitAddAddress({ label: main?.label || "Home", line1: draft.line1, city: draft.city, postcode: draft.postcode, phone: me.phone });
    if (main) await kitDeleteAddress(main.id);
    setBusy(false);
    setChanging(false);
    router.refresh();
  };
  const remove = async () => {
    if (!main) return;
    if (!ctx.live) return setLocal(addresses.filter((a) => a.id !== main.id));
    setBusy(true);
    await kitDeleteAddress(main.id);
    setBusy(false);
    router.refresh();
  };
  const tabs: { id: Tab; label: string; phoneOrder: string }[] = [
    { id: "contact", label: str(data, "contactTab"), phoneOrder: "order-2" },
    { id: "saved", label: str(data, "savedTab"), phoneOrder: "order-1" },
    { id: "orders", label: str(data, "ordersTab"), phoneOrder: "order-3" },
  ];
  const portrait = str(data, "portrait");
  const groups = ctx.savedGroups ?? [];

  return (
    <section data-k="account" className="relative min-h-[calc(849*var(--u))] md:min-h-[calc(966*var(--u))]">
      {/* Left: the portrait and what is on it (desktop); the top of the page (phone). */}
      <div className="relative px-[calc(16*var(--u))] md:absolute md:left-0 md:top-0 md:h-[calc(966*var(--u))] md:w-[calc(864*var(--u))] md:px-0">
        {portrait ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={portrait} alt="" className={cn("absolute inset-0 hidden h-full w-full md:block", isFilePhoto(portrait) ? "object-cover" : WHOLE)} />
        ) : null}
        <div className="relative flex flex-col gap-[calc(32*var(--u))] md:absolute md:left-[calc(32*var(--u))] md:top-[calc(686*var(--u))] md:w-[calc(585*var(--u))]">
          <div className="md:w-[calc(425*var(--u))]">
            <h1 {...kt("serif", 64, 96)} className={cn(kt("serif", 64, 96).className, "whitespace-nowrap")}>{fill(str(data, "greeting"), { name: me.firstName })}</h1>
            <p {...kt("sans", 14, 20)}>{str(data, "intro")}</p>
          </div>
          <nav aria-label="Account" className="flex justify-evenly md:justify-start md:gap-[calc(32*var(--u))]">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                aria-current={tab === t.id ? "page" : undefined}
                onClick={() => setTab(t.id)}
                {...kt("sans", 14, 20)}
                className={cn(kt("sans", 14, 20).className, t.phoneOrder, "whitespace-nowrap uppercase underline md:order-none", tab !== t.id && "opacity-50")}
              >
                {t.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Right: the open tab. */}
      <div className="px-[calc(16*var(--u))] pt-[calc(105*var(--u))] md:ml-[calc(896*var(--u))] md:w-[calc(800*var(--u))] md:px-0 md:pt-[calc(32*var(--u))]">
        {tab === "contact" ? (
          <>
            <h2 {...kt("khand", 32)} className={cn(kt("khand", 32).className, "uppercase")}>{str(data, "contactTab")}</h2>
            <div className="mt-[calc(32*var(--u))] flex flex-col items-end gap-[calc(32*var(--u))]">
              <div className="flex w-full flex-col gap-[calc(32*var(--u))] md:flex-row">
                <Field label={str(data, "nameLabel")} value={`${me.firstName} ${me.lastName}`.trim()} />
                <Field label={str(data, "emailLabel")} value={me.email} />
              </div>
              <Dim onClick={() => setEditNote((v) => !v)} pressed={editNote}>{str(data, "editLabel")}</Dim>
              {editNote ? <p role="status" {...kt("sans", 16)} className={cn(kt("sans", 16).className, "self-end opacity-80")}>{ktx(ctx, "account.detailsNote")}</p> : null}
            </div>
            <div className="mt-[calc(16*var(--u))] flex flex-col items-end gap-[calc(32*var(--u))]">
              <div className="flex w-full flex-col gap-[calc(32*var(--u))] md:flex-row md:items-start">
                <Field label={str(data, "phoneLabel")} value={me.phone} />
                <div className="flex w-full flex-col gap-[calc(32*var(--u))] md:w-[calc(384*var(--u))]">
                  <Field label={str(data, "cityLabel")} value={main?.parts?.city ?? ""} wide />
                  <Field label={str(data, "addressLabel")} value={main?.parts?.line1 ?? main?.lines[0] ?? ""} wide />
                  <Field label={str(data, "postcodeLabel")} value={main?.parts?.postcode ?? ""} wide />
                </div>
              </div>
              <div className="flex gap-[calc(32*var(--u))]">
                <Dim onClick={startChange} pressed={changing}>{str(data, "changeLabel")}</Dim>
                {main ? <Dim onClick={remove}>{str(data, "removeLabel")}</Dim> : null}
              </div>
              {changing ? (
                <form
                  className="flex w-full flex-col gap-[calc(32*var(--u))] md:w-[calc(384*var(--u))]"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void save();
                  }}
                >
                  {ctx.checkout ? (
                    <KiteSelect label={str(data, "cityLabel")} options={ctx.checkout.cities} placeholder={ktx(ctx, "checkout.cityPlaceholder")} value={draft.city} onChange={(c) => setDraft((d) => ({ ...d, city: c }))} />
                  ) : (
                    <KiteField label={str(data, "cityLabel")} value={draft.city} onChange={(e) => setDraft((d) => ({ ...d, city: e.target.value }))} />
                  )}
                  <KiteField label={str(data, "addressLabel")} value={draft.line1} onChange={(e) => setDraft((d) => ({ ...d, line1: e.target.value }))} />
                  <KiteField label={str(data, "postcodeLabel")} value={draft.postcode} onChange={(e) => setDraft((d) => ({ ...d, postcode: e.target.value }))} />
                  <div className="flex gap-[calc(16*var(--u))]">
                    <KiteButton type="submit" disabled={busy || !draft.line1.trim() || !draft.city.trim()} className="flex-1">{ktx(ctx, "account.saveAddress")}</KiteButton>
                    <KiteButton variant="outline" onClick={() => setChanging(false)}>{ktx(ctx, "account.cancel")}</KiteButton>
                  </div>
                </form>
              ) : null}
            </div>
          </>
        ) : null}

        {tab === "saved" ? (
          <div className="flex flex-col gap-[calc(32*var(--u))]">
            {groups.map((g) => (
              <div key={g.title} className="flex flex-col gap-[calc(16*var(--u))] md:gap-[calc(32*var(--u))]">
                <h2 {...kt("khand", 32)}>{g.title}</h2>
                <div className="-mx-[calc(16*var(--u))] overflow-x-auto px-[calc(16*var(--u))] [scrollbar-width:none] md:mx-0 md:-mr-[calc(32*var(--u))] md:px-0">
                  <div className="flex w-max gap-[calc(32*var(--u))]">
                    {g.items.map((p) => (
                      <KitePieceCard
                        key={p.id}
                        product={{ ...p, priceText: kiteMoney(p.price, ctx.currency) }}
                        photoHeight={279}
                        addLabel={str(data, "addLabel")}
                        blurb="full"
                        className="w-[calc(292*var(--u))] shrink-0"
                      />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {tab === "orders" ? (
          <>
            <h2 {...kt("khand", 32)} className={cn(kt("khand", 32).className, "uppercase")}>{str(data, "ordersTab")}</h2>
            <div className="mt-[calc(32*var(--u))] flex flex-col gap-[calc(32*var(--u))]">
              {me.orders.map((o) => (
                <div key={o.id} className="flex flex-col gap-[calc(16*var(--u))] md:flex-row md:items-end md:justify-between">
                  <div className="relative h-[calc(67*var(--u))] w-full md:w-[calc(500*var(--u))]">
                    <p {...kt("sans", 16)} className={cn(kt("sans", 16).className, "opacity-80")}>{o.date}</p>
                    <div className="absolute inset-x-0 top-[calc(31*var(--u))] flex justify-between">
                      <p {...kt("sans", 20)}>{fill(str(data, "refLabel"), { id: o.id })}</p>
                      <p {...kt("sans", 20)}>{kiteMoney(o.total, ctx.currency)}</p>
                    </div>
                    <span aria-hidden className="absolute inset-x-0 top-[calc(66.5*var(--u))] h-px bg-[#f4f3f1]" />
                  </div>
                  <div className="flex gap-[calc(32*var(--u))] md:mb-[calc(0*var(--u))]">
                    <Dim href={o.href}>{str(data, "viewLabel")}</Dim>
                    {str(data, "rateLabel") ? <Dim href={o.href}>{str(data, "rateLabel")}</Dim> : null}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}
