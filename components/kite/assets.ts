/**
 * The file's own images, by what they are. Each is public/kite/<hash>.png —
 * the bytes the designer placed, named by their Figma hash (scripts/figma/images.mjs).
 */
const at = (hash: string) => `/kite/${hash}.png`;

export const KITE_ICON = {
  search: at("7868aa3e5e27fc001a8d780ec8bd4ddc596e7e9b"),
  user: at("8892334c33ada3235a6f8929adc21254326e005b"),
  bag: at("6e25b18de66e66a3c5e4d281eafe7470d5a730a4"),
  menu: at("afac7a140653c2ddfb797d8b2d18a1d8834a998a"),
} as const;

export const KITE_IMG = {
  newYork: at("a42954299d52ef22b8c139b86dd57cbd5c176144"),
  losAngeles: at("ab8154c46ff6a3b9331b2ab8adc3c0310f25ff98"),
  pieceCloak: at("ae520783ab263b34170ec82dfc91d3cb82b750e5"),
  pieceWall: at("dce87de5cf3c53bcde4883753b09c9ea95288237"),
} as const;
