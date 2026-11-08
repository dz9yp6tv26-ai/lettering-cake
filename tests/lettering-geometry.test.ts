import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parse } from "opentype.js";
import { Mesh, MeshBasicMaterial, Raycaster, Vector3, DoubleSide } from "three";
import {
  buildLetteringGeometry,
  meshFontFiles,
} from "../src/lib/lettering-geometry";
import { letteringFonts, koreanFontIds } from "../src/lib/lettering-fonts";
import { letteringPositions } from "../src/lib/lettering-style";
const load = (file: string) => {
  const bytes = readFileSync(`public${file}`);
  return parse(
    bytes.buffer.slice(
      bytes.byteOffset,
      bytes.byteOffset + bytes.byteLength,
    ) as ArrayBuffer,
  );
};
const fallback = load(meshFontFiles.classic);
test("all fonts create actual beveled extrusion; Korean fallback has real outlines", () => {
  assert(fallback.charToGlyphIndex("축") > 0);
  for (const item of letteringFonts) {
    const font = load(meshFontFiles[item.id]);
    if (koreanFontIds.includes(item.id)) {
      for (const char of "생일축하해") assert(font.charToGlyphIndex(char) > 0, `${item.id} has ${char}`);
    }
    const geometry = buildLetteringGeometry(
      "Happy 축하",
      font,
      fallback,
      "top-center",
    )!;
    assert(geometry.attributes.position.count > 100);
    assert(geometry.boundingBox!.min.y > 0.65);
    assert(geometry.boundingBox!.max.y > 0.69);
    assert(geometry.boundingBox!.max.y < 0.71);
    assert(geometry.parameters.options.bevelEnabled);
    assert.equal(geometry.parameters.options.depth, 0.03);
    for (const n of geometry.attributes.position.array)
      assert(Number.isFinite(n));
    geometry.dispose();
  }
});
test("four placements fit their surfaces; cylinder lettering follows a constant radial depth", () => {
  for (const p of letteringPositions) {
    const g = buildLetteringGeometry(
      "Happy birthday\n축하해",
      fallback,
      fallback,
      p.value,
    )!;
    const vertices = g.attributes.position;
    for (let i = 0; i < vertices.count; i++) {
      const x = vertices.getX(i),
        y = vertices.getY(i),
        z = vertices.getZ(i);
      if (p.value === "front-side") {
        assert(Math.hypot(x, z) > 1.002 && Math.hypot(x, z) < 1.05);
        assert(y > 0.14 && y < 0.51);
      }
      if (p.value === "top-center") assert(Math.hypot(x, z) < 0.94);
      if (p.value === "top-rim")
        assert(Math.hypot(x, z) < 0.88 && Math.hypot(x, z) > 0.66);
      if (p.value === "board") {
        assert(y > -0.09 && y < -0.04);
        assert(z > 1.07 && z < 1.27);
      }
    }
    g.dispose();
  }
});
test("glyph holes remain open and empty lettering creates no mesh", () => {
  const font = load(meshFontFiles.fredoka);
  const geometry = buildLetteringGeometry("O", font, fallback, "top-center")!;
  const center = geometry.boundingBox!.getCenter(new Vector3());
  const material = new MeshBasicMaterial({ side: DoubleSide });
  const mesh = new Mesh(geometry, material);
  mesh.updateMatrixWorld();
  const ray = new Raycaster(
    new Vector3(center.x, 1, center.z),
    new Vector3(0, -1, 0),
  );
  assert.equal(ray.intersectObject(mesh).length, 0);
  geometry.dispose();
  material.dispose();
  assert.equal(buildLetteringGeometry(" \n", font, fallback, "board"), null);
});
