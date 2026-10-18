import { Page } from "@/components/next-admin/ui";
import { Themes } from "@/components/next-admin/themes";

export const metadata = { title: "Themes" };

export default function ThemesPage() {
  return (
    <Page title="Themes" sub="How your store looks. Your copies, the live one, and every theme there is.">
      <Themes />
    </Page>
  );
}
