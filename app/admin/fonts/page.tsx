import { db } from "@/lib/data/shop";
import { getThemeTokens } from "@/lib/data/theme";
import { FontsManager } from "@/components/customizer/fonts-manager";
import { PageHeader } from "@/components/ui/primitives";
import { isScanConfigured } from "@/lib/virus-scan";

export const dynamic = "force-dynamic";

export default async function FontsPage() {
  const [fonts, tokens] = await Promise.all([
    (await db()).fontAsset.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        url: true,
        format: true,
        sizeBytes: true,
        scanStatus: true,
        scanProvider: true,
        scanDetail: true,
      },
    }),
    getThemeTokens(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fonts"
        description="Upload your own typefaces and choose which one headings and body text use across the whole store."
      />
      <FontsManager fonts={fonts} tokens={tokens} scanEnabled={isScanConfigured()} />
    </div>
  );
}
