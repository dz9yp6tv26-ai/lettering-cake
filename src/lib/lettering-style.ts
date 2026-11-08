export const letteringColors = [
  { name: "화이트", value: "#fff7e8" },
  { name: "초코 브라운", value: "#59382c" },
  { name: "핑크", value: "#df849e" },
  { name: "파스텔 옐로우", value: "#f2d67b" },
  { name: "민트", value: "#91cbb4" },
  { name: "파란색", value: "#709bd2" },
  { name: "버건디", value: "#9f4b64" },
  { name: "라벤더", value: "#b49ad1" },
] as const;
export const letteringPositions = [
  { value: "top-center", label: "윗면 중앙" },
  { value: "top-rim", label: "윗면 테두리" },
  { value: "front-side", label: "케이크 측면" },
  { value: "board", label: "케이크 판" },
] as const;
export type LetteringPosition = (typeof letteringPositions)[number]["value"];
export const DEFAULT_LETTERING_COLOR = "#9f4b64";
export const DEFAULT_LETTERING_POSITION: LetteringPosition = "top-center";
export const isLetteringPosition = (
  value: unknown,
): value is LetteringPosition =>
  letteringPositions.some((p) => p.value === value);
export const isLetteringColor = (value: unknown): value is string =>
  typeof value === "string" && /^#[\da-f]{6}$/i.test(value);
