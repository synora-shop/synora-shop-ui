import type { SectionSchema } from "@/lib/section-schema";
import { KITE_IMG } from "@/components/kite/assets";

/** Kite's account, as the live customizer offers it — every default the file's. */
export const kiteAccountSchema: SectionSchema = {
  type: "KITE_ACCOUNT",
  label: "Account",
  description: "A greeting over a portrait, and the customer's details, saved pieces and orders.",
  category: "Commerce",
  singleton: true,
  fields: [
    { key: "portrait", kind: "image", label: "Portrait", info: "Behind the greeting, on the desktop.", default: KITE_IMG.accountPortrait },
    { key: "greeting", kind: "text", label: "Greeting", info: "Use {name} for the customer's first name.", default: "Hi, {name}" },
    { key: "intro", kind: "text", label: "Under the greeting", info: "", default: "You can manage your account here. Please, choose what you’d like to do." },
    { key: "contactTab", kind: "text", label: "Details tab", info: "Also its heading.", default: "contact information" },
    { key: "savedTab", kind: "text", label: "Saved tab", info: "", default: "saved items" },
    { key: "ordersTab", kind: "text", label: "Orders tab", info: "Also its heading.", default: "order history" },
    { key: "nameLabel", kind: "text", label: "Name label", info: "", default: "NAME" },
    { key: "emailLabel", kind: "text", label: "Email label", info: "", default: "EMAIL" },
    { key: "phoneLabel", kind: "text", label: "Phone label", info: "", default: "PHONE" },
    { key: "cityLabel", kind: "text", label: "City label", info: "", default: "CITY" },
    { key: "addressLabel", kind: "text", label: "Address label", info: "", default: "ADDRESS" },
    { key: "postcodeLabel", kind: "text", label: "Postal code label", info: "", default: "POSTAL CODE" },
    { key: "editLabel", kind: "text", label: "Edit", info: "", default: "EDIT" },
    { key: "changeLabel", kind: "text", label: "Change", info: "", default: "CHANGE" },
    { key: "removeLabel", kind: "text", label: "Remove", info: "", default: "REMOVE" },
    { key: "refLabel", kind: "text", label: "Order reference", info: "Use {id} for the order's number.", default: "Ref: {id}" },
    { key: "viewLabel", kind: "text", label: "View", info: "", default: "VIEW" },
    { key: "rateLabel", kind: "text", label: "Rate", info: "Leave empty to hide.", default: "RATE" },
    { key: "addLabel", kind: "text", label: "Add to cart", info: "On saved pieces.", default: "Add to cart" },
  ],
};
