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
  kind: "cherry" | "candle" | "heart";
  position: Vec3;
  rotation: Vec3;
  scale: number;
};
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
  message: string;
  recipient: string;
  strokes: CreamStroke[];
  toppings: Topping3D[];
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
  const s = input as Cake3DState;
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
  const toppings = s.toppings.map((t) => {
    if (
      !t ||
      typeof t.id !== "string" ||
      t.id.length > 64 ||
      !["cherry", "candle", "heart"].includes(t.kind) ||
      !vec(t.position, 2) ||
      !vec(t.rotation, Math.PI * 2) ||
      !Number.isFinite(t.scale) ||
      t.scale < 0.1 ||
      t.scale > 2
    )
      throw new Error("Invalid topping");
    return {
      id: t.id,
      kind: t.kind,
      position: [...t.position] as Vec3,
      rotation: [...t.rotation] as Vec3,
      scale: t.scale,
    };
  });
  return {
    schemaVersion: 1,
    coordinateSystem: "cake-local-y-up",
    cake: { radius: 1, height: 0.65, color: s.cake.color, cream: s.cake.cream },
    lettering: s.lettering,
    message: s.message,
    recipient: s.recipient,
    strokes,
    toppings,
  };
}
export function serializeCake3DState(state: Cake3DState): string {
  return JSON.stringify(parseCake3DState(state));
}
export function presetToppings(kind: Topping3D["kind"]): Topping3D[] {
  return [
    {
      id: "preset-0",
      kind,
      position: [0, 0.65, -0.38],
      rotation: [0, 0, 0],
      scale: 1,
    },
  ];
}
