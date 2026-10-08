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
    { key: "intro", kind: "text", label: "Under the greeting", info: "The line under the greeting, before the tabs.", default: "You can manage your account here. Please, choose what you’d like to do." },
    { key: "contactTab", kind: "text", label: "Details tab", info: "The first tab's name, and the heading over the customer's details.", default: "contact information" },
    { key: "savedTab", kind: "text", label: "Saved tab", info: "The tab of pieces the customer saved; also the heading over them.", default: "saved items" },
    { key: "ordersTab", kind: "text", label: "Orders tab", info: "The tab of past orders, and the heading over them.", default: "order history" },
    { key: "nameLabel", kind: "text", label: "Name label", info: "Over the customer's name, in the details tab.", default: "NAME" },
    { key: "emailLabel", kind: "text", label: "Email label", info: "Over the customer's email, in the details tab.", default: "EMAIL" },
    { key: "phoneLabel", kind: "text", label: "Phone label", info: "Over the customer's phone number, in the details tab.", default: "PHONE" },
    { key: "cityLabel", kind: "text", label: "City label", info: "Over the city of the customer's main address.", default: "CITY" },
    { key: "addressLabel", kind: "text", label: "Address label", info: "Over the street of the customer's main address.", default: "ADDRESS" },
    { key: "postcodeLabel", kind: "text", label: "Postal code label", info: "Over the postal code of the customer's main address.", default: "POSTAL CODE" },
    { key: "editLabel", kind: "text", label: "Edit", info: "Under the name and email; pressed, it says how details are changed.", default: "EDIT" },
    { key: "changeLabel", kind: "text", label: "Change", info: "Under the address; pressed, it opens the address to change.", default: "CHANGE" },
    { key: "removeLabel", kind: "text", label: "Remove", info: "Beside Change; pressed, it removes the address.", default: "REMOVE" },
    { key: "refLabel", kind: "text", label: "Order reference", info: "Use {id} for the order's number.", default: "Ref: {id}" },
    { key: "viewLabel", kind: "text", label: "View", info: "Beside each order; opens that order's page.", default: "VIEW" },
    { key: "rateLabel", kind: "text", label: "Rate", info: "Beside View on each order, also to the order's page. Leave empty to hide.", default: "RATE" },
    { key: "addLabel", kind: "text", label: "Add to cart", info: "The words beside the arrow on each saved piece.", default: "Add to cart" },
    { key: "savedEmpty", kind: "text", label: "No saved items", info: "The Saved items tab when nothing is saved. Not in the file.", default: "Nothing saved yet. ADD TO FAVORITES on any piece keeps it here." },
    { key: "savedEmptyLink", kind: "text", label: "No saved items: link", info: "Under that, to the collection.", default: "See the collection" },
  ],
};
