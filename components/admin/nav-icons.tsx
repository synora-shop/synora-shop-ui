import { cn } from "@/lib/utils";

/**
 * The sidebar's icons, drawn for this product.
 *
 * Eight of these are the shapes from Assestz/SVG — the same file the rest of
 * the panel was drawn in — not a general-purpose icon set standing in for them.
 * A stock library gets you a house and a gear; it does not get you *those*
 * eight, at these weights, sized against each other the way a designer sized
 * them.
 *
 * Data and Discounts joined the sidebar when the three groups were introduced,
 * and both were already drawn — Assestz has had a Data glyph and a Discount
 * glyph all along, which is its own evidence that they were meant to be
 * sidebar destinations rather than tabs buried under Your App.
 *
 * CustomersIcon and AccountIcon are the two exceptions and are marked as such
 * below: Assestz has neither, because the sidebar had six sections when it was
 * drawn. They are drawn here to match the set — same fill, same optical weight,
 * same construction — and should be replaced by real ones when the design file
 * gains them.
 *
 * Each arrives with its own viewBox and its own proportions, which is the point
 * and also the catch: Analytics is tall and narrow, Products is square. They
 * are drawn into a fixed square box with the aspect ratio preserved and
 * centred, so a row of them reads as one set rather than six drawings of
 * different sizes.
 *
 * `currentColor` throughout — the source files carry #343434 and #e0e0e0 fills,
 * which would ignore the active pill and leave a dark glyph on the brand
 * colour. The colour belongs to the state, not to the file.
 */

type IconProps = {
  className?: string;
  /** Decorative by default: the label beside it already names the destination. */
  title?: string;
};

function Glyph({
  viewBox,
  className,
  title,
  children,
}: IconProps & { viewBox: string; children: React.ReactNode }) {
  return (
    <svg
      viewBox={viewBox}
      // Fitted rather than stretched. Without this the tall Analytics bars and
      // the square Products tag would be scaled to the same box and arrive at
      // visibly different weights.
      preserveAspectRatio="xMidYMid meet"
      fill="currentColor"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      className={cn("h-[18px] w-[18px] flex-shrink-0", className)}
    >
      {title && <title>{title}</title>}
      {children}
    </svg>
  );
}

/** Home — Assestz/SVG/Home icon.svg */
export function HomeIcon(props: IconProps) {
  return (
    <Glyph viewBox="0 0 22.21 20.37" {...props}>
      <path d="M11.11,0c-.42,0-.84.14-1.19.43L.36,8.41c-.35.3-.48.81-.25,1.21.3.51.96.6,1.39.24l.33-.28v8.47c0,1.28,1.04,2.31,2.31,2.31h13.89c1.28,0,2.31-1.04,2.31-2.31v-8.47l.33.28c.17.14.38.22.59.22.32,0,.64-.17.82-.49.22-.39.09-.89-.25-1.18l-1.49-1.24v-3.93c0-.51-.41-.93-.93-.93h-.93c-.51,0-.93.41-.93.93v1.61L12.29.43c-.34-.29-.77-.43-1.19-.43ZM11.11,1.92c.05,0,.11.02.15.05l7.26,6.06v9.55c0,.51-.41.93-.93.93h-3.7v-6.48c0-.51-.41-.93-.93-.93h-3.7c-.51,0-.93.41-.93.93v6.48h-3.7c-.51,0-.93-.41-.93-.93v-9.55L10.96,1.98s.1-.05.15-.05Z" />
    </Glyph>
  );
}

/** Products — Assestz/SVG/Product icon.svg */
export function ProductIcon(props: IconProps) {
  return (
    <Glyph viewBox="0 0 21.1 21.1" {...props}>
      <path d="M6.5,7.99c.82,0,1.49-.67,1.49-1.49s-.67-1.49-1.49-1.49-1.49.67-1.49,1.49.67,1.49,1.49,1.49ZM2.48,0C1.11,0,0,1.11,0,2.48v7.51c0,.79.31,1.55.87,2.1l7.84,7.84c1.55,1.55,4.06,1.55,5.61,0l5.61-5.61c1.55-1.55,1.55-4.06,0-5.61L12.1.87c-.56-.56-1.32-.87-2.1-.87H2.48ZM1.98,2.48c0-.27.22-.5.5-.5h7.51c.26,0,.52.1.7.29l7.84,7.84c.77.78.77,2.03,0,2.81l-5.61,5.61c-.77.77-2.03.77-2.81,0l-7.84-7.84c-.19-.19-.29-.44-.29-.7V2.48Z" />
    </Glyph>
  );
}

/** Your App — Assestz/SVG/Your App icon.svg */
export function YourAppIcon(props: IconProps) {
  return (
    <Glyph viewBox="0 0 19.03 19.04" {...props}>
      <path fillRule="evenodd" clipRule="evenodd" d="M16.18,0H2.85C1.28,0,0,1.28,0,2.86v13.32c0,1.58,1.28,2.86,2.85,2.86h13.33c1.57,0,2.85-1.28,2.85-2.86V2.86c0-1.58-1.28-2.86-2.85-2.86ZM17.13,16.18c0,.53-.43.95-.95.95H2.85c-.52,0-.95-.42-.95-.95V2.86c0-.53.43-.95.95-.95h13.33c.52,0,.95.42.95.95v13.32Z" />
    </Glyph>
  );
}

/** Preferences — Assestz/SVG/Preferences icon.svg */
export function PreferencesIcon(props: IconProps) {
  return (
    <Glyph viewBox="0 0 19.03 14.27" {...props}>
      <path d="M1.43,2.85c.79,0,1.43-.64,1.43-1.43s-.64-1.43-1.43-1.43S0,.64,0,1.43s.64,1.43,1.43,1.43ZM5.71.48c-.53,0-.95.43-.95.95s.43.95.95.95h12.37c.53,0,.95-.43.95-.95s-.43-.95-.95-.95H5.71ZM13.32,6.19c.53,0,.95.43.95.95s-.43.95-.95.95H.95c-.53,0-.95-.43-.95-.95s.43-.95.95-.95h12.37ZM4.76,12.85c0-.53.43-.95.95-.95h12.37c.53,0,.95.43.95.95s-.43.95-.95.95H5.71c-.53,0-.95-.43-.95-.95ZM16.18,7.14c0,.79.64,1.43,1.43,1.43s1.43-.64,1.43-1.43-.64-1.43-1.43-1.43-1.43.64-1.43,1.43ZM1.43,14.27c.79,0,1.43-.64,1.43-1.43s-.64-1.43-1.43-1.43-1.43.64-1.43,1.43.64,1.43,1.43,1.43Z" />
    </Glyph>
  );
}

/** Analytics — Assestz/SVG/Analytics icon.svg */
export function AnalyticsIcon(props: IconProps) {
  return (
    <Glyph viewBox="0 0 13.32 19.03" {...props}>
      <path d="M7.61,18.08c0,.53.43.95.95.95s.95-.43.95-.95V.95c0-.53-.43-.95-.95-.95s-.95.43-.95.95v17.13ZM0,18.08c0,.53.43.95.95.95s.95-.43.95-.95v-9.52c0-.53-.43-.95-.95-.95s-.95.43-.95.95v9.52ZM4.76,19.03c-.53,0-.95-.43-.95-.95v-7.61c0-.53.43-.95.95-.95s.95.43.95.95v7.61c0,.53-.43.95-.95.95ZM11.42,18.08c0,.53.43.95.95.95s.95-.43.95-.95V4.76c0-.53-.43-.95-.95-.95s-.95.43-.95.95v13.32Z" />
    </Glyph>
  );
}

/**
 * Customers — NOT from Assestz. Drawn to match the set; see the note at the
 * top of this file.
 *
 * Two figures rather than one, because the section is a list of people and a
 * single head reads as "your account" — which is a different destination, two
 * rows down under Settings. The second figure is behind and slightly smaller,
 * so the pair still reads at 18px instead of turning into a blob.
 */
export function CustomersIcon(props: IconProps) {
  return (
    <Glyph viewBox="0 0 22 20.37" {...props}>
      {/* The person in front. */}
      <path d="M8.55,0C6.11,0,4.13,1.98,4.13,4.42s1.98,4.42,4.42,4.42,4.42-1.98,4.42-4.42S10.99,0,8.55,0ZM8.55,1.85c1.42,0,2.57,1.15,2.57,2.57s-1.15,2.57-2.57,2.57-2.57-1.15-2.57-2.57,1.15-2.57,2.57-2.57Z" />
      <path d="M8.55,10.37c-3.55,0-6.48,1.72-7.9,4.36-.72,1.34-.83,2.87-.32,4.03.53,1.19,1.62,1.61,2.6,1.61h11.24c.98,0,2.07-.42,2.6-1.61.51-1.16.4-2.69-.32-4.03-1.42-2.64-4.35-4.36-7.9-4.36ZM8.55,12.22c2.9,0,5.16,1.35,6.27,3.39.47.88.5,1.79.31,2.22-.11.25-.26.31-.91.31H2.93c-.65,0-.8-.06-.91-.31-.19-.43-.16-1.34.31-2.22,1.1-2.05,3.36-3.39,6.27-3.39Z" />
      {/* The one behind: shifted right, drawn smaller, and cut off by the
          frame the way a second person in a photograph would be. */}
      <path d="M16.34,2.31c-.5,0-.98.09-1.43.25-.48.17-.73.7-.56,1.18.17.48.7.73,1.18.56.25-.09.52-.14.8-.14,1.32,0,2.39,1.07,2.39,2.39s-1.07,2.39-2.39,2.39c-.28,0-.55-.05-.8-.14-.48-.17-1.01.08-1.18.56-.17.48.08,1.01.56,1.18.45.16.93.25,1.43.25,2.34,0,4.24-1.9,4.24-4.24s-1.9-4.24-4.24-4.24Z" />
      <path d="M17.72,11.99c-.51,0-.93.41-.93.93s.41.93.93.93c1.79,0,3.17.79,3.83,2.03.28.53.3,1.06.19,1.31-.05.11-.09.14-.35.14-.51,0-.93.41-.93.93s.41.93.93.93c.85,0,1.68-.38,2.05-1.24.42-.97.31-2.19-.25-3.24-1-1.87-3.05-3.7-5.47-3.7Z" />
    </Glyph>
  );
}

/** Settings — Assestz/SVG/Settings icon.svg */
export function SettingsIcon(props: IconProps) {
  return (
    <Glyph viewBox="0 0 20.37 20.37" {...props}>
      <path d="M8.82,0c-.62,0-1.15.45-1.25,1.06l-.27,1.57c-.14.05-.28.11-.42.17l-1.29-.92c-.57-.39-1.24-.25-1.63.14l-1.93,1.93c-.44.44-.5,1.13-.14,1.63l.91,1.3c-.06.14-.12.28-.17.42l-1.57.27c-.61.11-1.06.64-1.06,1.26v2.73c0,.62.45,1.15,1.06,1.25l1.57.27c.05.14.11.28.17.42l-.92,1.29c-.36.51-.3,1.2.14,1.63l1.93,1.93c.5.49,1.2.45,1.63.14l1.3-.91c.14.06.28.12.42.17l.27,1.57c.11.61.64,1.06,1.26,1.06h2.73c.62,0,1.15-.45,1.25-1.06l.27-1.57c.14-.05.28-.11.42-.17l1.29.92c.38.28,1.11.38,1.63-.14l1.93-1.93c.44-.44.5-1.13.14-1.63l-.91-1.3c.06-.14.12-.28.17-.42l1.57-.27c.61-.11,1.06-.64,1.06-1.26v-2.73c0-.62-.45-1.15-1.06-1.25l-1.57-.27c-.05-.14-.11-.28-.17-.42l.92-1.29c.36-.51.3-1.2-.14-1.63l-1.93-1.93c-.49-.48-1.17-.47-1.63-.14l-1.3.91c-.14-.06-.28-.12-.42-.17l-.27-1.57c-.11-.61-.64-1.06-1.26-1.06h-2.73ZM9.36,1.85h1.65s.05.02.06.05l.36,2.08c.82.29,1.58.6,2.27.94l1.72-1.21s.06-.01.08,0l1.17,1.17s.02.05,0,.07l-1.22,1.72c.35.74.67,1.5.94,2.27l2.08.36s.05.03.05.06v1.65s-.02.05-.05.06l-2.08.36c-.27.77-.58,1.53-.94,2.27l1.22,1.72s.01.05,0,.07l-1.17,1.17s-.05.02-.08,0l-1.72-1.21c-.76.36-1.52.67-2.27.94l-.36,2.08s-.03.05-.06.05h-1.65s-.05-.02-.06-.05l-.36-2.08c-.74-.26-1.5-.57-2.27-.94l-1.72,1.22s-.05.01-.07,0l-1.17-1.17s-.02-.05,0-.08l1.21-1.72c-.36-.77-.67-1.53-.94-2.27l-2.08-.36s-.05-.03-.05-.06v-1.65s.02-.05.05-.06l2.08-.36c.27-.76.58-1.51.94-2.27l-1.22-1.72s-.01-.05,0-.07l1.17-1.17s.05-.02.08,0l1.72,1.21c.72-.34,1.48-.66,2.27-.94l.36-2.08s.03-.05.06-.05ZM10.19,6.02c-2.3,0-4.17,1.87-4.17,4.17s1.87,4.17,4.17,4.17,4.17-1.87,4.17-4.17-1.87-4.17-4.17-4.17ZM10.19,7.87c1.28,0,2.31,1.04,2.31,2.31s-1.04,2.31-2.31,2.31-2.31-1.04-2.31-2.31,1.04-2.31,2.31-2.31Z" />
    </Glyph>
  );
}

/** Data — Assestz/SVG/Data icon.svg */
export function DataIcon(props: IconProps) {
  return (
    <Glyph viewBox="0 0 21.3 17.59" {...props}>
      <path d="M19.14,8.8H6.32c-.4,0-.76.26-.88.64l-2.03,6.3h13.51c.2,0,.38-.13.44-.32l2-6.33c.02-.07,0-.15-.03-.2-.04-.06-.11-.09-.18-.09ZM17.59,3.7h-8.75c-.84,0-1.66-.29-2.31-.81l-.79-.63c-.33-.26-.74-.41-1.16-.41h-1.8c-.51,0-.93.42-.93.93v11.74l1.82-5.64c.37-1.15,1.43-1.93,2.64-1.93h12.2v-2.31c0-.51-.42-.93-.93-.93ZM17.59,1.85c1.53,0,2.78,1.25,2.78,2.78v2.57c.22.13.41.3.57.5.35.47.45,1.09.27,1.65l-2.09,6.62c-.31.97-1.19,1.62-2.21,1.62H2.78c-1.53,0-2.78-1.25-2.78-2.78V2.78C0,1.25,1.25,0,2.78,0h1.8c.84,0,1.66.29,2.31.81l.79.63c.33.26.74.41,1.16.41h8.75Z" />
    </Glyph>
  );
}

/** Discounts — Assestz/SVG/Discount icon.svg */
export function DiscountsIcon(props: IconProps) {
  return (
    <Glyph viewBox="0 0 20.28 21.05" {...props}>
      <path d="M10.14,21.05c-.63,0-1.23-.25-1.67-.7l-.91-.92c-.15-.15-.36-.22-.57-.19l-1.28.21c-.62.1-1.25-.05-1.76-.42-.51-.37-.85-.92-.94-1.55l-.2-1.28c-.03-.21-.17-.39-.35-.49l-1.15-.58c-.57-.29-.99-.77-1.18-1.38-.2-.6-.14-1.24.15-1.81l.59-1.15c.1-.19.1-.41,0-.6h0s-.59-1.15-.59-1.15c-.29-.56-.34-1.21-.15-1.81.2-.6.62-1.09,1.18-1.38l1.15-.58c.19-.1.32-.28.35-.49l.2-1.28c.09-.62.43-1.17.94-1.55.51-.37,1.14-.52,1.77-.42l1.28.21c.21.03.42-.04.57-.19l.91-.92c.89-.9,2.46-.9,3.35,0l.91.92c.15.15.36.22.57.19l1.28-.21c.62-.1,1.25.05,1.77.42.51.37.85.92.94,1.55l.2,1.28c.03.21.17.39.35.49l1.15.58c.57.28.98.77,1.18,1.38.2.6.14,1.24-.15,1.81l-.59,1.15c-.1.19-.1.41,0,.6l.59,1.15c.29.56.34,1.21.15,1.81-.2.6-.62,1.09-1.18,1.38l-1.16.58c-.19.1-.32.28-.35.49l-.2,1.28c-.09.62-.43,1.18-.94,1.55s-1.14.52-1.77.42l-1.27-.21c-.22-.04-.42.04-.57.19l-.91.92c-.45.45-1.04.7-1.67.7ZM7.09,17.54c.62,0,1.23.25,1.68.7l.91.92c.25.25.68.25.93,0l.91-.92c.54-.54,1.3-.79,2.05-.67l1.27.21c.18.03.35-.01.49-.12s.24-.26.26-.43l.2-1.28c.12-.75.59-1.41,1.27-1.75l1.15-.58c.16-.08.27-.21.33-.38.05-.17.04-.35-.04-.5l-.59-1.15c-.35-.68-.35-1.48,0-2.16l.59-1.15c.08-.16.09-.33.04-.5-.05-.17-.17-.3-.33-.38l-1.15-.58c-.68-.34-1.15-.99-1.27-1.75l-.2-1.28c-.03-.17-.12-.33-.26-.43-.14-.1-.32-.15-.49-.12l-1.28.21c-.75.12-1.52-.13-2.05-.67l-.91-.92c-.25-.25-.68-.25-.93,0l-.91.92c-.54.54-1.3.79-2.05.67l-1.27-.21c-.18-.03-.35.01-.49.12s-.23.26-.26.43l-.2,1.28c-.12.75-.59,1.41-1.27,1.75l-1.15.58c-.16.08-.27.21-.33.38-.05.17-.04.35.04.5l.59,1.15c.35.68.35,1.48,0,2.16l-.59,1.15c-.08.16-.09.33-.04.5.05.17.17.3.33.38l1.15.58c.68.34,1.15.99,1.27,1.75l.2,1.28c.03.17.12.33.26.43s.32.15.49.12l1.28-.21c.13-.02.25-.03.38-.03ZM8.77,14.69l4.06-7.64c.19-.37.06-.82-.31-1.01-.37-.19-.82-.05-1.01.31l-4.06,7.64c-.19.37-.06.82.31,1.01.11.06.23.09.35.09.27,0,.53-.14.66-.4ZM13.54,14.73c-1.17,0-2.12-1.07-2.12-2.39s.95-2.39,2.12-2.39,2.12,1.07,2.12,2.39-.95,2.39-2.12,2.39ZM13.54,11.46c-.33,0-.62.41-.62.89s.29.89.62.89.62-.42.62-.89-.29-.89-.62-.89ZM6.74,11.07c-1.17,0-2.12-1.07-2.12-2.39s.95-2.39,2.12-2.39,2.12,1.07,2.12,2.39-.95,2.39-2.12,2.39ZM6.74,7.79c-.33,0-.62.42-.62.89s.29.89.62.89.62-.41.62-.89-.29-.89-.62-.89Z" />
    </Glyph>
  );
}

/**
 * Account — not in Assestz.
 *
 * The same exception as CustomersIcon: the design file was drawn when Account
 * was a tab under Settings, so it has no glyph for it. Drawn here to sit in the
 * set — a head and shoulders inside a ring, which separates it from the
 * two-person CustomersIcon at a glance: that one is the people who buy from
 * you, this one is you. Replace it when the design file gains a real one.
 */
export function AccountIcon(props: IconProps) {
  return (
    <Glyph viewBox="0 0 21 21" {...props}>
      <path d="M10.5,0C4.7,0,0,4.7,0,10.5S4.7,21,10.5,21s10.5-4.7,10.5-10.5S16.3,0,10.5,0ZM10.5,1.85c4.78,0,8.65,3.87,8.65,8.65,0,2.03-.7,3.89-1.87,5.36-.53-1.19-1.5-2.14-2.72-2.62l-1.18-.47c-.3-.12-.64-.03-.85.22-.5.6-1.24.95-2.03.95s-1.53-.35-2.03-.95c-.21-.25-.55-.34-.85-.22l-1.18.47c-1.22.49-2.19,1.43-2.72,2.62-1.16-1.47-1.87-3.33-1.87-5.36C1.85,5.72,5.72,1.85,10.5,1.85ZM10.5,4.32c-1.96,0-3.55,1.59-3.55,3.55s1.59,3.55,3.55,3.55,3.55-1.59,3.55-3.55-1.59-3.55-3.55-3.55ZM10.5,6.17c.94,0,1.7.76,1.7,1.7s-.76,1.7-1.7,1.7-1.7-.76-1.7-1.7.76-1.7,1.7-1.7ZM8.16,14.86c.68.51,1.5.79,2.34.79s1.67-.28,2.34-.79l.6.24c1.03.41,1.76,1.32,1.96,2.39-1.38.96-3.05,1.52-4.86,1.52s-3.48-.56-4.86-1.52c.2-1.07.93-1.98,1.96-2.39l.6-.24Z" />
    </Glyph>
  );
}
