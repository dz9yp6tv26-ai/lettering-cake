import { isLetteringFont, type LetteringFont } from "./lettering-fonts";
import {
  isLetteringColor,
  isLetteringPosition,
  type LetteringPosition,
} from "./lettering-style";
/** Cake-local coordinates: Y up, bottom at 0, radius = 1, height = 0.65. */
export type Vec3 = [number, number, number];
export type CreamStroke = {
  id: string;
  surface: "top" | "side";
  color: string;
  radius: number;
  points: Vec3[];
};
export type Topping3D = {
  id: string;
  kind: ToppingKind;
  position: Vec3;
  rotation: Vec3;
  scale: number;
};
export const toppingPresets = [
  { kind: "cherry", label: "체리", icon: "🍒", footprint: 0.29 },
  { kind: "heart", label: "하트", icon: "💕", footprint: 0.29 },
  { kind: "strawberry", label: "딸기", icon: "🍓", footprint: 0.2 },
  { kind: "rose", label: "장미", icon: "🌹", footprint: 0.28 },
  { kind: "ribbon", label: "리본", icon: "🎀", footprint: 0.4 },
  { kind: "star", label: "별", icon: "⭐", footprint: 0.3 },
] as const;
export type ToppingKind = (typeof toppingPresets)[number]["kind"];
export const candleShapes = [
  { value: "straight", label: "일자 초" },
  { value: "bear", label: "곰돌이 초" },
  { value: "heart", label: "하트 초" },
  { value: "number", label: "숫자 초" },
] as const;
export const candleColors = [
  { name: "파스텔 핑크", value: "#efafc4" },
  { name: "옐로우", value: "#f4d789" },
  { name: "소라색", value: "#a8cce7" },
  { name: "민트", value: "#a5d3bc" },
  { name: "초코", value: "#785044" },
] as const;
export type CandleConfig = {
  shape: (typeof candleShapes)[number]["value"];
  count: number;
  color: string;
  isLit: boolean;
  enabled?: boolean;
  sparkle?: boolean;
  number?: string;
  /** Optional restored manual positions; otherwise use the radial layout. */
  positions?: Vec3[];
};
export const defaultCandles: CandleConfig = {
  shape: "straight",
  count: 1,
  color: "#f4d789",
  isLit: true,
  enabled: true,
  sparkle: true,
  number: "1",
};
export function parseCandles(input: unknown): CandleConfig {
  const c = input as CandleConfig;
  if (
    !c ||
    !candleShapes.some((s) => s.value === c.shape) ||
    !Number.isInteger(c.count) ||
    c.count < 1 ||
    c.count > 99 ||
    !hex(c.color) ||
    typeof c.isLit !== "boolean" ||
    (c.enabled !== undefined && typeof c.enabled !== "boolean") ||
    (c.sparkle !== undefined && typeof c.sparkle !== "boolean") ||
    (c.number !== undefined &&
      (typeof c.number !== "string" || !/^(0|[1-9]\d?)$/.test(c.number))) ||
    (c.positions !== undefined &&
      (!Array.isArray(c.positions) ||
        c.positions.length !== c.count ||
        !c.positions.every(
          (p) =>
            vec(p, 1.1) &&
            Math.abs(p[1] - 0.65) < 0.002 &&
            Math.hypot(p[0], p[2]) <= 0.9,
        )))
  )
    throw new Error("Invalid candle configuration");
  return {
    shape: c.shape,
    count: c.count,
    color: c.color,
    isLit: c.isLit,
    ...(c.enabled !== undefined ? { enabled: c.enabled } : {}),
    ...(c.sparkle !== undefined ? { sparkle: c.sparkle } : {}),
    ...(c.number !== undefined ? { number: c.number } : {}),
    ...(c.positions
      ? { positions: c.positions.map((p) => [...p] as Vec3) }
      : {}),
  };
}
export function candleLayout(
  config: CandleConfig,
): { position: Vec3; scale: number }[] {
  const scale =
    (config.shape === "straight" ? 0.95 : 0.7) *
    (config.shape === "number" && (config.number ?? "1").length === 2
      ? 0.65
      : 1) *
    Math.min(1, Math.sqrt(7 / config.count));
  return Array.from({ length: config.count }, (_, i) => {
    if (config.positions)
      return { position: [...config.positions[i]] as Vec3, scale };
    if (config.count === 1)
      return { position: [0.48, 0.65, -0.43] as Vec3, scale };
    const angle = i * Math.PI * (3 - Math.sqrt(5));
    const radius =
      config.count <= 8 ? 0.69 : 0.78 * Math.sqrt((i + 0.5) / config.count);
    return {
      position: [
        Math.cos(angle) * radius,
        0.65,
        Math.sin(angle) * radius,
      ] as Vec3,
      scale,
    };
  });
}
export function placeTopping(kind: ToppingKind, point: Vec3, scale = 1): Vec3 {
  const footprint =
    toppingPresets.find((p) => p.kind === kind)!.footprint * scale;
  const max = Math.max(0, 1 - footprint - 0.02),
    radius = Math.hypot(point[0], point[2]);
  const ratio = radius > max ? max / radius : 1;
  return [point[0] * ratio, 0.651, point[2] * ratio];
}
export type Cake3DState = {
  schemaVersion: 1;
  coordinateSystem: "cake-local-y-up";
  cake: {
    radius: 1;
    height: 0.65;
    color: string;
    cream: "shell" | "pearl" | "none";
  };
  lettering: string;
  letteringFont?: LetteringFont;
  fontFamily?: LetteringFont;
  letteringColor?: string;
  letteringPosition?: LetteringPosition;
  message: string;
  recipient: string;
  strokes: CreamStroke[];
  toppings: Topping3D[];
  candles?: CandleConfig;
};
export const MAX_STROKES = 24;
export const MAX_POINTS = 100;
const hex = (v: unknown): v is string =>
  typeof v === "string" && /^#[\da-f]{6}$/i.test(v);
const vec = (v: unknown, bound: number): v is Vec3 =>
  Array.isArray(v) &&
  v.length === 3 &&
  v.every(
    (n) => typeof n === "number" && Number.isFinite(n) && Math.abs(n) <= bound,
  );
/** Strict boundary for untrusted links and future JSONB reads; never merge unknown fields. */
export function parseCake3DState(input: unknown): Cake3DState {
  const s = input as Omit<Cake3DState, "toppings"> & {
    toppings: (Omit<Topping3D, "kind"> & { kind: ToppingKind | "candle" })[];
  };
  if (
    !s ||
    s.schemaVersion !== 1 ||
    s.coordinateSystem !== "cake-local-y-up" ||
    !s.cake ||
    s.cake.radius !== 1 ||
    s.cake.height !== 0.65 ||
    !hex(s.cake.color) ||
    !["shell", "pearl", "none"].includes(s.cake.cream) ||
    typeof s.lettering !== "string" ||
    s.lettering.length > 30 ||
    (s.letteringFont !== undefined && !isLetteringFont(s.letteringFont)) ||
    (s.fontFamily !== undefined && !isLetteringFont(s.fontFamily)) ||
    (s.letteringColor !== undefined && !isLetteringColor(s.letteringColor)) ||
    (s.letteringPosition !== undefined &&
      !isLetteringPosition(s.letteringPosition)) ||
    typeof s.message !== "string" ||
    s.message.length > 100 ||
    typeof s.recipient !== "string" ||
    s.recipient.length > 20 ||
    !Array.isArray(s.strokes) ||
    s.strokes.length > MAX_STROKES ||
    !Array.isArray(s.toppings) ||
    s.toppings.length > 12
  )
    throw new Error("Invalid 3D cake");
  const strokes = s.strokes.map((stroke) => {
    if (
      !stroke ||
      typeof stroke.id !== "string" ||
      stroke.id.length > 64 ||
      !hex(stroke.color) ||
      !Number.isFinite(stroke.radius) ||
      stroke.radius < 0.015 ||
      stroke.radius > 0.08 ||
      !["top", "side"].includes(stroke.surface) ||
      !Array.isArray(stroke.points) ||
      stroke.points.length < 1 ||
      stroke.points.length > MAX_POINTS ||
      !stroke.points.every(
        (p) =>
          vec(p, 1.2) &&
          (stroke.surface === "top"
            ? Math.abs(p[1] - 0.685) < 0.002 && Math.hypot(p[0], p[2]) <= 1.002
            : p[1] >= 0 &&
              p[1] <= 0.65 &&
              Math.abs(Math.hypot(p[0], p[2]) - 1.035) < 0.003),
      )
    )
      throw new Error("Invalid cream stroke");
    return {
      id: stroke.id,
      surface: stroke.surface,
      color: stroke.color,
      radius: stroke.radius,
      points: stroke.points.map((p) => [...p] as Vec3),
    };
  });
  const toppings = s.toppings.flatMap((t) => {
    if (
      !t ||
      typeof t.id !== "string" ||
      t.id.length > 64 ||
      !(t.kind === "candle" || toppingPresets.some((p) => p.kind === t.kind)) ||
      !vec(t.position, 2) ||
      !vec(t.rotation, Math.PI * 2) ||
      !Number.isFinite(t.scale) ||
      t.scale < 0.1 ||
      t.scale > 2
    )
      throw new Error("Invalid topping");
    if (t.kind === "candle") return [];
    return [
      {
        id: t.id,
        kind: t.kind,
        position: [...t.position] as Vec3,
        rotation: [...t.rotation] as Vec3,
        scale: t.scale,
      },
    ];
  });
  const legacyCandles = s.toppings.filter((t) => t.kind === "candle");
  const candles =
    s.candles !== undefined
      ? parseCandles(s.candles)
      : legacyCandles.length
        ? {
            ...defaultCandles,
            count: legacyCandles.length,
            positions: legacyCandles.map((t) => {
              const r = Math.hypot(t.position[0], t.position[2]);
              const k = r > 0.9 ? 0.9 / r : 1;
              return [t.position[0] * k, 0.65, t.position[2] * k] as Vec3;
            }),
          }
        : undefined;
  return {
    schemaVersion: 1,
    coordinateSystem: "cake-local-y-up",
    cake: { radius: 1, height: 0.65, color: s.cake.color, cream: s.cake.cream },
    lettering: s.lettering,
    ...(s.fontFamily !== undefined ? { fontFamily: s.fontFamily } : {}),
    ...(s.letteringColor !== undefined
      ? { letteringColor: s.letteringColor }
      : {}),
    ...(s.letteringPosition !== undefined
      ? { letteringPosition: s.letteringPosition }
      : {}),
    ...(s.letteringFont !== undefined
      ? { letteringFont: s.letteringFont }
      : {}),
    message: s.message,
    recipient: s.recipient,
    strokes,
    toppings,
    ...(candles ? { candles } : {}),
  };
}
export function serializeCake3DState(state: Cake3DState): string {
  return JSON.stringify(parseCake3DState(state));
}
export function presetToppings(
  kind: ToppingKind | "candle" | "none",
): Topping3D[] {
  if (kind === "candle" || kind === "none") return [];
  return [
    {
      id: "preset-0",
      kind,
      position: placeTopping(kind, [0, 0.65, -0.4]),
      rotation: [0, 0, 0],
      scale: 1,
    },
  ];
}
