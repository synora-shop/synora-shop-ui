export function FaqList({
  heading,
  items,
}: {
  heading?: string;
  items?: { question: string; answer: string }[];
}) {
  if (!items || items.length === 0) return null;
  return (
    <div className="mx-auto max-w-3xl">
      {heading && <h2 className="text-center font-serif text-3xl font-semibold">{heading}</h2>}
      <div className="mt-10 divide-y divide-border rounded-lg border border-border bg-white">
        {items.map((item, i) => (
          <details key={i} className="group p-5">
            <summary className="cursor-pointer list-none font-medium text-ink marker:hidden">
              {item.question}
            </summary>
            <p className="mt-2 whitespace-pre-line text-sm text-ink-soft">{item.answer}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
