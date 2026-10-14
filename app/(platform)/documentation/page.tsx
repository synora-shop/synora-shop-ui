import { permanentRedirect } from "next/navigation";

/**
 * The docs moved to /docs on 14 October. This address was in the footer and
 * may be in people's bookmarks, so it forwards rather than 404s; a #section
 * on the old link survives the redirect (the browser carries it over).
 */
export default function DocumentationMoved() {
  permanentRedirect("/docs");
}
