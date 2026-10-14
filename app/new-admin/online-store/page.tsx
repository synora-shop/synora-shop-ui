import { PageHeader } from "@/components/new-admin/ui";
import { Themes } from "@/components/new-admin/themes";

export const metadata = { title: "Themes" };

export default function ThemesPage() {
  return (
    <>
      <PageHeader icon="app" tone="sky" title="Themes" sub="How your store looks. Your copies, the live one, and every theme there is." />
      <Themes />
    </>
  );
}
