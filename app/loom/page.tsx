import { LoomNavbar } from "@/components/loom/navbar";
import { LoomNavigation } from "@/components/loom/navigation";

export default function LoomPage() {
  return (
    <main className="mx-auto w-[1440px]">
      <LoomNavbar />
      <LoomNavigation />
    </main>
  );
}
