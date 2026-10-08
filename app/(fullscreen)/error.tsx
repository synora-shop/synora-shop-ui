"use client";

/**
 * The customizer and the other full-screen admin pages had no error page of
 * their own — `app/admin/error.tsx` covers the `admin` folder, not this
 * route group — so a throw here showed Next's bare "Application error". The
 * admin's own last resort, reused.
 */
export { default } from "@/app/admin/error";
