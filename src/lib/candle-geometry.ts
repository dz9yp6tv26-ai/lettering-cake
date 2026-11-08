import {
  Shape,
  ShapePath,
  ExtrudeGeometry,
  CylinderGeometry,
  type BufferGeometry,
} from "three";
import type { Font } from "opentype.js";
import type { CandleConfig, Vec3 } from "./cake3d";
import { heartShape } from "./decoration-geometry";

function bearShape() {
  const s = new Shape();
  s.moveTo(-0.1, 0);
  s.bezierCurveTo(-0.22, -0.015, -0.19, 0.12, -0.13, 0.16);
  s.bezierCurveTo(-0.28, 0.12, -0.3, 0.26, -0.16, 0.29);
  s.lineTo(-0.11, 0.33);
  s.bezierCurveTo(-0.2, 0.37, -0.19, 0.43, -0.14, 0.46);
  s.bezierCurveTo(-0.23, 0.59, -0.04, 0.62, -0.045, 0.5);
  s.quadraticCurveTo(0, 0.52, 0.045, 0.5);
  s.bezierCurveTo(0.04, 0.62, 0.23, 0.59, 0.14, 0.46);
  s.bezierCurveTo(0.19, 0.43, 0.2, 0.37, 0.11, 0.33);
  s.lineTo(0.16, 0.29);
  s.bezierCurveTo(0.3, 0.26, 0.28, 0.12, 0.13, 0.16);
  s.bezierCurveTo(0.19, 0.12, 0.22, -0.015, 0.1, 0);
  s.quadraticCurveTo(0, 0.075, -0.1, 0);
  s.closePath();
  return s;
}
function upright(geometry: BufferGeometry) {
  geometry.computeBoundingBox();
  const b = geometry.boundingBox!;
  const scale = 0.5 / (b.max.y - b.min.y);
  geometry.translate(
    -(b.max.x + b.min.x) / 2,
    -b.min.y,
    -(b.max.z + b.min.z) / 2,
  );
  geometry.scale(scale, scale, 1);
  geometry.computeBoundingBox();
  return geometry;
}
export function makeCandleModel(
  shape: CandleConfig["shape"],
  number: string,
  font?: Font,
): { geometry: BufferGeometry; wick: Vec3 } | null {
  if (shape === "straight") {
    const g = new CylinderGeometry(0.027, 0.027, 0.5, 16);
    g.translate(0, 0.25, 0);
    return { geometry: g, wick: [0, 0.5, 0] };
  }
  if (shape === "number") {
    if (!font) return null;
    const outline = font.getPath(number, 0, 0, 1);
    const path = new ShapePath();
    for (const c of outline.commands)
      switch (c.type) {
        case "M":
          path.moveTo(c.x, -c.y);
          break;
        case "L":
          path.lineTo(c.x, -c.y);
          break;
        case "Q":
          path.quadraticCurveTo(c.x1, -c.y1, c.x, -c.y);
          break;
        case "C":
          path.bezierCurveTo(c.x1, -c.y1, c.x2, -c.y2, c.x, -c.y);
          break;
        case "Z":
          path.currentPath?.closePath();
          break;
      }
    const g = upright(
      new ExtrudeGeometry(path.toShapes(), {
        depth: 0.065,
        bevelEnabled: true,
        bevelSize: 0.015,
        bevelThickness: 0.012,
        bevelSegments: 3,
        curveSegments: 12,
      }),
    );
    const width = g.boundingBox!.max.x - g.boundingBox!.min.x;
    return {
      geometry: g,
      wick: [number.length === 2 ? -width * 0.25 : 0, 0.49, 0],
    };
  }
  const geometry = upright(
    new ExtrudeGeometry(shape === "heart" ? heartShape() : bearShape(), {
      depth: 0.065,
      bevelEnabled: true,
      bevelSize: 0.015,
      bevelThickness: 0.014,
      bevelSegments: 4,
      curveSegments: 20,
    }),
  );
  return { geometry, wick: [0, shape === "heart" ? 0.4 : 0.46, 0] };
}
