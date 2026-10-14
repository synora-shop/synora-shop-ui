import { redirect } from "next/navigation";

/** The console opens on the tickets. */
export default function SynoraConsoleHome() {
  redirect("/synora/tickets");
}
