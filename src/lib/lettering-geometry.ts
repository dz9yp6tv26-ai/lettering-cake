import { Box2, ExtrudeGeometry, ShapePath, Vector2 } from "three";
import type { Font, PathCommand } from "opentype.js";
import type { LetteringFont } from "./lettering-fonts";
import type { LetteringPosition } from "./lettering-style";

export const meshFontFiles: Record<LetteringFont, string> = {
  classic: "/fonts/NanumPenScript-Regular.ttf",
  pacifico: "/fonts/Pacifico-Regular.ttf",
  fredoka: "/fonts/Fredoka-Variable.ttf",
  cherry: "/fonts/CherrySwash-Regular.ttf",
  shrikhand: "/fonts/Shrikhand-Regular.ttf",
};

/** Keep depth in cake units; fitting scales the outlines, never the extrusion. */
export const LETTERING_DEPTH = 0.03;
export const LETTERING_BEVEL = 0.005;
export function buildLetteringGeometry(
  text: string,
  font: Font,
  fallback: Font,
  position: LetteringPosition,
) {
  if (!text.trim()) return null;
  const paths: PathCommand[][] = [];
  const bounds = new Box2();
  const normalized = text.normalize("NFC");
  // Rim arcs and the narrow board strip are single-line surfaces.
  const lines =
    position === "top-rim" || position === "board"
      ? [normalized.replace(/\s*\n\s*/g, " ")]
      : normalized.split("\n");
  lines.forEach((line, row) => {
    const commands: PathCommand[] = [];
    let cursor = 0;
    let previous: ReturnType<Font["charToGlyph"]> | undefined;
    let previousFont: Font | undefined;
    for (const character of Array.from(line)) {
      const face = font.charToGlyphIndex(character) ? font : fallback;
      const glyph = face.charToGlyph(
        face.charToGlyphIndex(character) ? character : "?",
      );
      if (previous && previousFont === face)
        cursor += face.getKerningValue(previous, glyph) / face.unitsPerEm;
      commands.push(
        ...glyph.getPath(cursor, row * 1.35, 1, undefined, face).commands,
      );
      cursor += (glyph.advanceWidth ?? face.unitsPerEm * 0.5) / face.unitsPerEm;
      previous = glyph;
      previousFont = face;
    }
    // Center each line independently; path commands use Y-down coordinates.
    const lineBounds = new Box2();
    for (const cmd of commands) {
      if ("x" in cmd) lineBounds.expandByPoint(new Vector2(cmd.x, cmd.y));
      if ("x1" in cmd) lineBounds.expandByPoint(new Vector2(cmd.x1, cmd.y1));
      if ("x2" in cmd) lineBounds.expandByPoint(new Vector2(cmd.x2, cmd.y2));
    }
    if (lineBounds.isEmpty()) return;
    const center = lineBounds.getCenter(new Vector2()).x;
    const shifted = commands.map((cmd) => {
      const c = { ...cmd };
      if ("x" in c) {
        c.x -= center;
        bounds.expandByPoint(new Vector2(c.x, c.y));
      }
      if ("x1" in c) {
        c.x1 -= center;
        bounds.expandByPoint(new Vector2(c.x1, c.y1));
      }
      if ("x2" in c) {
        c.x2 -= center;
        bounds.expandByPoint(new Vector2(c.x2, c.y2));
      }
      return c;
    });
    paths.push(shifted);
  });
  if (bounds.isEmpty()) return null;
  const size = bounds.getSize(new Vector2());
  const center = bounds.getCenter(new Vector2());
  const limits = {
    "top-center": [1.42, 0.78],
    "top-rim": [1.95, 0.17],
    "front-side": [2.0, 0.34],
    board: [2.2, 0.18],
  }[position];
  const scale = Math.min(
    limits[0] / Math.max(size.x, 0.001),
    limits[1] / Math.max(size.y, 0.001),
    0.46,
  );
  const shapes = paths.flatMap((commands) => {
    const path = new ShapePath();
    const x = (v: number) => (v - center.x) * scale;
    const y = (v: number) => -(v - center.y) * scale;
    for (const cmd of commands) {
      switch (cmd.type) {
        case "M":
          path.moveTo(x(cmd.x), y(cmd.y));
          break;
        case "L":
          path.lineTo(x(cmd.x), y(cmd.y));
          break;
        case "Q":
          path.quadraticCurveTo(x(cmd.x1), y(cmd.y1), x(cmd.x), y(cmd.y));
          break;
        case "C":
          path.bezierCurveTo(
            x(cmd.x1),
            y(cmd.y1),
            x(cmd.x2),
            y(cmd.y2),
            x(cmd.x),
            y(cmd.y),
          );
          break;
        case "Z":
          path.currentPath?.closePath();
          break;
      }
    }
    return path.toShapes();
  });
  if (!shapes.length) return null;
  const geometry = new ExtrudeGeometry(shapes, {
    depth: LETTERING_DEPTH,
    steps: 1,
    bevelEnabled: true,
    bevelThickness: LETTERING_BEVEL,
    bevelSize: Math.min(LETTERING_BEVEL, scale * 0.018),
    bevelSegments: 3,
    curveSegments: 8,
  });
  const vertices = geometry.attributes.position;
  for (let i = 0; i < vertices.count; i++) {
    const x = vertices.getX(i),
      y = vertices.getY(i),
      depth = vertices.getZ(i);
    if (position === "front-side") {
      const angle = x / 1.009,
        radius = 1.009 + depth;
      vertices.setXYZ(
        i,
        radius * Math.sin(angle),
        0.325 + y,
        radius * Math.cos(angle),
      );
    } else if (position === "top-rim") {
      const angle = x / 0.75,
        radius = 0.75 - y;
      vertices.setXYZ(
        i,
        radius * Math.sin(angle),
        0.662 + depth,
        radius * Math.cos(angle),
      );
    } else if (position === "board") {
      vertices.setXYZ(i, x, -0.082 + depth, 1.17 - y);
    } else {
      vertices.setXYZ(
        i,
        x,
        0.662 + depth,
        -y + 0.05 - 0.06 * (1 - (x / 0.72) ** 2),
      );
    }
  }
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}
