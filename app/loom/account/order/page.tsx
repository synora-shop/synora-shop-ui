import type { Metadata } from "next";
import { LoomShell } from "@/components/loom/shell";
import { LoomBreadcrumb } from "@/components/loom/breadcrumb";
import { LoomTemplateView } from "@/components/loom/template";
import { ORDER } from "@/components/loom/templates";
import { DEMO_MENUS } from "@/components/loom/demo-menus";
import { SHOES } from "@/components/loom/catalogue";
import type { LoomOrder } from "@/components/loom/contract";

export const metadata: Metadata = { title: "Order LM-12476 — Loom reference build" };

/** The demo order — the first one in the account's list, on its way. */
const ORDER_LM12476: LoomOrder = {
  id: "LM-12476",
  placed: "4 October 2026",
  stage: 2,
  dates: ["4 October", "5 October", "6 October", "9 October"],
  arriving: "Thursday 9 October",
  lines: [
    { id: "skate-hi", title: "Skateboard Shoe", src: "/loom/7150a0e902536ab1a554d315fc11f4ef6f9c1302.png", colour: "Red Pastel", size: "US 9", qty: 1, price: 125, href: "/loom/product" },
    { id: "sport", title: "Sportwear Shoe", src: "/loom/f8ae4065476b2a224ae85cd40fd6b1c7d34bc9ae.png", colour: "Clean White", size: "US 10", qty: 1, price: 159, href: "#" },
  ],
  delivery: 0,
  speed: "Standard delivery",
  address: ["Samantha William", "12 Court Lane", "Lahore 54000", "0300 1234567"],
  payment: "Card, paid 4 October",
  tracking: "LMX 2049 8812",
};

/** One order: its template, drawn. Ported, the order comes from the customer's account. */
export default function LoomOrderPage() {
  return (
    <LoomShell>
      <LoomBreadcrumb
        trail={[
          { label: "Home", href: "/loom" },
          { label: "Account", href: "/loom/account" },
        ]}
        current={`Order ${ORDER_LM12476.id}`}
      />
      <LoomTemplateView template={ORDER} ctx={{ menus: DEMO_MENUS, products: SHOES, order: ORDER_LM12476 }} />
    </LoomShell>
  );
}
