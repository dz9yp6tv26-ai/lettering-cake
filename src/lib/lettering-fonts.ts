export const letteringFonts = [
  {
    id: "classic",
    label: "기본 · 한글",
    family: "var(--font-nanum), cursive",
    variable: "--font-nanum",
    weight: 400,
    style: "normal",
    spacing: 0,
  },
  {
    id: "pacifico",
    label: "Pacifico",
    family: "var(--font-pacifico), cursive",
    variable: "--font-pacifico",
    weight: 400,
    style: "normal",
    spacing: 0,
  },
  {
    id: "fredoka",
    label: "Fredoka",
    family: "var(--font-fredoka), sans-serif",
    variable: "--font-fredoka",
    weight: 500,
    style: "normal",
    spacing: 0.01,
  },
  {
    id: "cherry",
    label: "Cherry",
    family: "var(--font-cherry), serif",
    variable: "--font-cherry",
    weight: 400,
    style: "normal",
    spacing: 0.01,
  },
  {
    id: "shrikhand",
    label: "Shrikhand",
    family: "var(--font-shrikhand), cursive",
    variable: "--font-shrikhand",
    weight: 400,
    style: "normal",
    spacing: 0.015,
  },
] as const;
export type LetteringFont = (typeof letteringFonts)[number]["id"];
export function isLetteringFont(value: unknown): value is LetteringFont {
  return letteringFonts.some((font) => font.id === value);
}
export function letteringFont(value?: LetteringFont) {
  return letteringFonts.find((font) => font.id === value) ?? letteringFonts[0];
}
