import {
  Shape,
  ExtrudeGeometry,
  LatheGeometry,
  Vector2,
  Vector3,
  CatmullRomCurve3,
  TubeGeometry,
} from "three";
import { ParametricGeometry } from "three/addons/geometries/ParametricGeometry.js";

export function heartShape() {
  const s = new Shape();
  s.moveTo(0, -0.24);
  s.bezierCurveTo(-0.06, -0.15, -0.3, -0.01, -0.25, 0.14);
  s.bezierCurveTo(-0.21, 0.29, -0.04, 0.29, 0, 0.14);
  s.bezierCurveTo(0.04, 0.29, 0.21, 0.29, 0.25, 0.14);
  s.bezierCurveTo(0.3, -0.01, 0.06, -0.15, 0, -0.24);
  s.closePath();
  return s;
}
export function roundedStarShape() {
  const points = Array.from({ length: 10 }, (_, i) => {
    const a = Math.PI / 2 + (i * Math.PI) / 5;
    const r = i % 2 ? 0.135 : 0.27;
    return new Vector2(Math.cos(a) * r, Math.sin(a) * r);
  });
  const s = new Shape();
  points.forEach((point, i) => {
    const before = point.clone().lerp(points[(i + 9) % 10], 0.2);
    const after = point.clone().lerp(points[(i + 1) % 10], 0.2);
    if (i === 0) s.moveTo(before.x, before.y);
    else s.lineTo(before.x, before.y);
    s.quadraticCurveTo(point.x, point.y, after.x, after.y);
  });
  s.closePath();
  return s;
}
export function flatCandyGeometry(shape: Shape, depth = 0.09) {
  const g = new ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelSize: 0.018,
    bevelThickness: 0.022,
    bevelSegments: 4,
    curveSegments: 24,
  });
  g.rotateX(-Math.PI / 2);
  g.computeBoundingBox();
  g.translate(0, -g.boundingBox!.min.y, 0);
  g.computeBoundingBox();
  return g;
}
export const strawberryRadius = (y: number) =>
  0.18 *
  Math.pow(Math.max(0, Math.sin((Math.PI * y) / 0.37)), 0.72) *
  (0.65 + (0.35 * y) / 0.37);
export function strawberryGeometry() {
  return new LatheGeometry(
    Array.from(
      { length: 33 },
      (_, i) => new Vector2(strawberryRadius((i * 0.37) / 32), (i * 0.37) / 32),
    ),
    32,
  );
}
export function leafGeometry() {
  const s = new Shape();
  s.moveTo(0, 0);
  s.bezierCurveTo(-0.06, 0.05, -0.04, 0.13, 0, 0.18);
  s.bezierCurveTo(0.05, 0.12, 0.05, 0.04, 0, 0);
  return flatCandyGeometry(s, 0.004);
}
export function petalGeometry() {
  return new ParametricGeometry(
    (u, v, target) => {
      const angle = (u - 0.5) * 1.8;
      const r = 0.025 + 0.16 * v;
      target.set(
        Math.sin(angle) * r,
        0.015 +
          0.19 * Math.sin(v * Math.PI * 0.65) -
          0.04 * v ** 4 +
          0.025 * Math.cos(angle) * v,
        Math.cos(angle) * r,
      );
    },
    18,
    18,
  );
}
function ribbonSection() {
  const s = new Shape();
  s.moveTo(-0.036, -0.01);
  s.quadraticCurveTo(-0.05, 0, -0.036, 0.01);
  s.lineTo(0.036, 0.01);
  s.quadraticCurveTo(0.05, 0, 0.036, -0.01);
  s.closePath();
  return s;
}
export function ribbonGeometry(side: number, tail = false) {
  const points = tail
    ? [
        [0, 0.07, 0],
        [side * 0.1, 0.04, 0.1],
        [side * 0.15, 0.025, 0.22],
        [side * 0.24, 0.035, 0.28],
      ]
    : [
        [0, 0.08, 0],
        [side * 0.15, 0.2, -0.1],
        [side * 0.28, 0.13, -0.04],
        [side * 0.18, 0.065, 0.075],
        [0, 0.08, 0],
      ];
  const geometry = new ExtrudeGeometry(ribbonSection(), {
    extrudePath: new CatmullRomCurve3(points.map((p) => new Vector3(...p))),
    steps: 44,
    bevelEnabled: false,
    curveSegments: 8,
  });
  geometry.computeBoundingBox();
  if (geometry.boundingBox!.min.y < 0)
    geometry.translate(0, -geometry.boundingBox!.min.y, 0);
  geometry.computeBoundingBox();
  return geometry;
}
export function stemGeometry(side: number) {
  return new TubeGeometry(
    new CatmullRomCurve3([
      new Vector3(side * 0.1, 0.22, 0),
      new Vector3(side * 0.09, 0.35, -0.01),
      new Vector3(0, 0.44, -0.03),
    ]),
    20,
    0.01,
    8,
    false,
  );
}
