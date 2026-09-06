import { SkeletonList } from "@/components/ui/skeleton";

/**
 * What the panel shows while a screen is on its way.
 *
 * One file for every admin route, because they mostly share a shape — a bar of
 * controls above a list — and a screen-specific skeleton is only worth writing
 * where the shape genuinely differs. Analytics has its own; the rest use this.
 *
 * The chrome is not repeated here. The sidebar, the heading bar and the
 * navigation bar live in the layout, so they stay on screen and only the part
 * that is actually changing is replaced — which is the point of putting this
 * at this level rather than around the whole panel.
 */
export default function AdminLoading() {
  return <SkeletonList />;
}
