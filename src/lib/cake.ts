import { parseCake3DState, type Cake3DState } from "./cake3d";
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
  topping: "cherry" | "candle" | "heart";
  lettering: string;
  message: string;
  recipient: string;
  design3D?: Cake3DState;
};
export const initialCake: Cake = {
  color: colors[0].value,
  cream: "shell",
  topping: "cherry",
  lettering: "happy\nbirthday",
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
      !["cherry", "candle", "heart"].includes(c.topping) ||
      typeof c.lettering !== "string" ||
      typeof c.message !== "string" ||
      typeof c.recipient !== "string"
    )
      return null;
    return {
      color: c.color,
      cream: c.cream,
      topping: c.topping,
      ...(c.design3D ? { design3D: parseCake3DState(c.design3D) } : {}),
      lettering: c.lettering.slice(0, 30),
      message: c.message.slice(0, 100),
      recipient: c.recipient.slice(0, 20),
    };
  } catch {
    return null;
  }
}
