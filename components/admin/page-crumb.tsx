"use client";

import { useEffect } from "react";
import { useAdminNav } from "@/lib/admin-nav-store";

/**
 * The last breadcrumb, named by the page itself.
 *
 * The heading bar can work out "Products > Orders" from the URL, but not
 * "Order #1042" — that is a record's name, and only the page that loaded the
 * record knows it. Drop this anywhere on a detail page and the crumb appears.
 *
 * It clears itself on the way out, so navigating from a product to a list never
 * leaves the product's name hanging in the trail.
 */
export function PageCrumb({ label }: { label: string }) {
  const setCrumb = useAdminNav((s) => s.setCrumb);
  useEffect(() => {
    setCrumb(label);
    return () => setCrumb(null);
  }, [label, setCrumb]);
  return null;
}
