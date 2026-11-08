import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parse } from "opentype.js";
import {
  candleLayout,
  parseCandles,
  defaultCandles,
  parseCake3DState,
  serializeCake3DState,
  presetToppings,
  placeTopping,
  toppingPresets,
  candleShapes,
  type Cake3DState,
} from "../src/lib/cake3d";
import { initialCake, encodeCake, decodeCake } from "../src/lib/cake";
import {
  flatCandyGeometry,
  heartShape,
  roundedStarShape,
  strawberryGeometry,
  petalGeometry,
  ribbonGeometry,
} from "../src/lib/decoration-geometry";
import { makeCandleModel } from "../src/lib/candle-geometry";
const state: Cake3DState = {
  schemaVersion: 1,
  coordinateSystem: "cake-local-y-up",
  cake: { radius: 1, height: 0.65, color: initialCake.color, cream: "shell" },
  lettering: "생일 축하해",
  message: "축하해 ♡",
  recipient: "지민",
  strokes: [],
  toppings: [],
};
test("every topping round-trips with candles through JSON and gift sharing", () => {
  for (const p of toppingPresets)
    for (const shape of candleShapes) {
      const design = {
        ...state,
        toppings: presetToppings(p.kind),
        candles: {
          ...defaultCandles,
          shape: shape.value,
          count: 99,
          number: "20",
          isLit: false,
          sparkle: false,
        },
      };
      assert.deepEqual(JSON.parse(serializeCake3DState(design)), design);
      assert.deepEqual(
        decodeCake(
          encodeCake({
            ...initialCake,
            topping: p.kind,
            candles: design.candles,
            design3D: design,
          }),
        )?.design3D,
        design,
      );
    }
});
test("legacy candle toppings migrate without losing their saved positions or adding candles to old cakes", () => {
  const legacy = {
    ...state,
    toppings: [
      {
        id: "old-candle",
        kind: "candle",
        position: [0.2, 0.65, -0.3],
        rotation: [0, 0, 0],
        scale: 1,
      },
      ...presetToppings("heart"),
    ],
  };
  const migrated = parseCake3DState(legacy);
  assert.equal(migrated.toppings.length, 1);
  assert.equal(migrated.toppings[0].kind, "heart");
  assert.equal(migrated.candles?.count, 1);
  assert.deepEqual(migrated.candles?.positions, [[0.2, 0.65, -0.3]]);
  assert.deepEqual(
    parseCake3DState(JSON.parse(serializeCake3DState(migrated))),
    migrated,
  );
  assert.equal(parseCake3DState(state).candles, undefined);
});
test("reject malformed candles, resource overflow, and invalid topping kinds", () => {
  for (const patch of [
    { count: 0 },
    { count: 100 },
    { count: 1.5 },
    { count: Infinity },
    { isLit: "yes" },
    { enabled: 1 },
    { sparkle: null },
    { shape: "bad" },
    { number: "100" },
    { number: "01" },
    { number: 12 },
    { color: "url(evil)" },
    { positions: [] },
    { positions: [[2, 0.65, 0]] },
    { positions: [[0, 2, 0]] },
  ])
    assert.throws(() => parseCandles({ ...defaultCandles, ...patch }));
  assert.throws(() =>
    parseCake3DState({
      ...state,
      toppings: [{ ...presetToppings("heart")[0], kind: "bad" }],
    }),
  );
});
test("1..99 candles stay within the cake, with distinct positions and size adapted to count", () => {
  for (let count = 1; count <= 99; count++)
    for (const shape of candleShapes) {
      const config = {
        ...defaultCandles,
        shape: shape.value,
        count,
        number: "20",
      };
      const layout = candleLayout(config);
      assert.equal(layout.length, count);
      assert.equal(
        new Set(layout.map((p) => p.position.join(","))).size,
        count,
      );
      for (const p of layout) {
        assert(Math.hypot(p.position[0], p.position[2]) < 0.9);
        assert.equal(p.position[1], 0.65);
        assert(p.scale > 0 && p.scale <= 1);
      }
    }
});
test("topping placement uses the mesh footprint to keep edges supported by the cake", () => {
  for (const p of toppingPresets)
    for (const scale of [0.1, 1, 2]) {
      const result = placeTopping(p.kind, [2, 10, 2], scale);
      assert.equal(result[1], 0.651);
      assert(Math.hypot(result[0], result[2]) + p.footprint * scale <= 0.981);
    }
});
test("smooth candy, strawberry, petal, and ribbon geometries are finite and have a supported base", () => {
  const geometries = [
    flatCandyGeometry(heartShape()),
    flatCandyGeometry(roundedStarShape()),
    strawberryGeometry(),
    petalGeometry(),
    ribbonGeometry(-1),
    ribbonGeometry(1, true),
  ];
  for (const geometry of geometries) {
    geometry.computeBoundingBox();
    assert(geometry.boundingBox!.min.y >= -1e-6);
    assert(geometry.attributes.position.count > 100);
    for (const v of geometry.attributes.position.array)
      assert(Number.isFinite(v));
    geometry.dispose();
  }
});
test("candle models have an actual half-unit wax body, including numerical 0/20/99", () => {
  const bytes = readFileSync("public/fonts/Fredoka-Variable.ttf");
  const font = parse(
    bytes.buffer.slice(
      bytes.byteOffset,
      bytes.byteOffset + bytes.byteLength,
    ) as ArrayBuffer,
  );
  for (const shape of candleShapes)
    for (const number of ["0", "20", "99"]) {
      const model = makeCandleModel(shape.value, number, font)!;
      model.geometry.computeBoundingBox();
      assert(Math.abs(model.geometry.boundingBox!.min.y) < 1e-5);
      assert(Math.abs(model.geometry.boundingBox!.max.y - 0.5) < 1e-5);
      for (const v of model.geometry.attributes.position.array)
        assert(Number.isFinite(v));
      model.geometry.dispose();
    }
});
