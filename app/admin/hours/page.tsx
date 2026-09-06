import { redirect } from "next/navigation";

/**
 * Not part of the e-commerce panel.
 *
 * APP.ai and the documentation were drawn for a shop that sells products. This
 * screen belongs to a business type whose design has not been drawn yet — a
 * restaurant's opening hours and locations, a blog's posts — so it is not in
 * the navigation, and a route nothing links to is a pathway that only breaks.
 *
 * The screen itself is not deleted: it is in the history, and its components,
 * actions and data layer are all still here. It comes back with the design that
 * needs it, rather than living on under a heading that says "Products".
 */
export default function NotInThisDesign() {
  redirect("/admin");
}
