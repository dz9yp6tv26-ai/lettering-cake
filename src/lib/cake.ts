import {
  parseCake3DState,
  parseCandles,
  toppingPresets,
  type Cake3DState,
  type CandleConfig,
  type ToppingKind,
} from "./cake3d";
import { isLetteringFont, type LetteringFont } from "./lettering-fonts";
import {
  isLetteringColor,
  isLetteringPosition,
  type LetteringPosition,
} from "./lettering-style";
export const colors = [
  { name: "딸기 우유", value: "#f4b9c7" },
  { name: "바닐라 크림", value: "#f7e6b7" },
  { name: "피스타치오", value: "#b7cbb2" },
  { name: "블루 소다", value: "#bdd5e8" },
  { name: "라벤더", value: "#cec0e0" },
  { name: "밀크 화이트", value: "#fff5e6" },
];
export type Cake = {
  color: string;
  cream: "shell" | "pearl" | "none";
  topping: ToppingKind | "candle" | "none";
  candles?: CandleConfig;
  lettering: string;
  letteringFont?: LetteringFont;
  fontFamily?: LetteringFont;
  letteringColor?: string;
  letteringPosition?: LetteringPosition;
  message: string;
  recipient: string;
  design3D?: Cake3DState;
};
export const initialCake: Cake = {
  color: colors[0].value,
  cream: "shell",
  topping: "cherry",
  lettering: "happy\nbirthday",
  fontFamily: "handwrite",
  message: "너의 모든 날이 오늘처럼 달콤하길 ♡",
  recipient: "",
};
export function encodeCake(cake: Cake) {
  const bytes = new TextEncoder().encode(JSON.stringify(cake));
  return btoa(Array.from(bytes, (b) => String.fromCharCode(b)).join(""));
}
export function decodeCake(value: string): Cake | null {
  try {
    if (value.length > 300000) return null;
    const c = JSON.parse(
      new TextDecoder().decode(
        Uint8Array.from(atob(value), (ch) => ch.charCodeAt(0)),
      ),
    );
    if (
      !colors.some((x) => x.value === c.color) ||
      !["shell", "pearl", "none"].includes(c.cream) ||
      !(
        c.topping === "candle" ||
        c.topping === "none" ||
        toppingPresets.some((p) => p.kind === c.topping)
      ) ||
      typeof c.lettering !== "string" ||
      typeof c.message !== "string" ||
      typeof c.recipient !== "string" ||
      (c.letteringFont !== undefined && !isLetteringFont(c.letteringFont)) ||
      (c.fontFamily !== undefined && !isLetteringFont(c.fontFamily)) ||
      (c.letteringColor !== undefined && !isLetteringColor(c.letteringColor)) ||
      (c.letteringPosition !== undefined &&
        !isLetteringPosition(c.letteringPosition))
    )
      return null;
    return {
      color: c.color,
      cream: c.cream,
      topping: c.topping,
      ...(c.candles !== undefined ? { candles: parseCandles(c.candles) } : {}),
      ...(c.design3D ? { design3D: parseCake3DState(c.design3D) } : {}),
      lettering: c.lettering.slice(0, 30),
      ...(c.fontFamily !== undefined ? { fontFamily: c.fontFamily } : {}),
      ...(c.letteringColor !== undefined
        ? { letteringColor: c.letteringColor }
        : {}),
      ...(c.letteringPosition !== undefined
        ? { letteringPosition: c.letteringPosition }
        : {}),
      ...(c.letteringFont !== undefined
        ? { letteringFont: c.letteringFont }
        : {}),
      message: c.message.slice(0, 100),
      recipient: c.recipient.slice(0, 20),
    };
  } catch {
    return null;
  }
}
