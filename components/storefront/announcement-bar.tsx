export function AnnouncementBar({ text, bgColor }: { text: string; bgColor: string }) {
  if (!text.trim()) return null;
  return (
    <div data-shp-region="announcement" style={{ backgroundColor: bgColor }} className="px-4 py-2 text-center text-xs font-medium text-white">
      {text}
    </div>
  );
}
