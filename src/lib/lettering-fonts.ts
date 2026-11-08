export const letteringFonts = [
  {
    id: "handwrite", label: "손글씨(개구)", family: "var(--font-gaegu), cursive",
    variable: "--font-gaegu", weight: 400, style: "normal", spacing: 0,
  },
  {
    id: "round", label: "동글체(주아)", family: "var(--font-jua), sans-serif",
    variable: "--font-jua", weight: 400, style: "normal", spacing: 0,
  },
  {
    id: "serif", label: "세리프(고운바탕)", family: "var(--font-gowun), serif",
    variable: "--font-gowun", weight: 400, style: "normal", spacing: 0,
  },
  {
    id: "sans", label: "모던(노토산스)", family: "var(--font-noto), sans-serif",
    variable: "--font-noto", weight: 400, style: "normal", spacing: 0,
  },
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
export const koreanFontIds: readonly LetteringFont[] = ["handwrite", "round", "serif", "sans"];
export function resolveLetteringFont(state: { fontFamily?: LetteringFont; letteringFont?: LetteringFont }): LetteringFont {
  // Missing fields belong to historical links that used Nanum Pen Script.
  return state.fontFamily ?? state.letteringFont ?? "classic";
}
export function isLetteringFont(value: unknown): value is LetteringFont {
  return letteringFonts.some((font) => font.id === value);
}
export function letteringFont(value?: LetteringFont) {
  return letteringFonts.find((font) => font.id === value) ?? letteringFonts[0];
}
