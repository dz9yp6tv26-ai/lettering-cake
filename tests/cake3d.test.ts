import { test } from "node:test";
import assert from "node:assert/strict";
import {
  parseCake3DState,
  serializeCake3DState,
  presetToppings,
  type Cake3DState,
} from "../src/lib/cake3d";
import { initialCake, encodeCake, decodeCake } from "../src/lib/cake";
import { letteringFonts } from "../src/lib/lettering-fonts";
import {
  letteringColors,
  letteringPositions,
} from "../src/lib/lettering-style";
const state: Cake3DState = {
  schemaVersion: 1,
  coordinateSystem: "cake-local-y-up",
  cake: { radius: 1, height: 0.65, color: "#f4b9c7", cream: "shell" },
  lettering: "생일 축하해",
  message: "늘 행복하길 ♡",
  recipient: "지민",
  toppings: presetToppings("cherry"),
  strokes: [
    {
      id: "top",
      surface: "top",
      color: "#fff7e3",
      radius: 0.035,
      points: [
        [0, 0.685, 0],
        [0.1, 0.685, 0.2],
      ],
    },
    {
      id: "side",
      surface: "side",
      color: "#fff7e3",
      radius: 0.035,
      points: [
        [1.035, 0.2, 0],
        [1.035, 0.4, 0],
      ],
    },
  ],
};
test("3D JSON preserves top/side strokes, metadata and topping transforms", () => {
  assert.deepEqual(
    parseCake3DState(JSON.parse(serializeCake3DState(state))),
    state,
  );
});
test("gift preserves Unicode and complete 3D state; old 2D links remain readable", () => {
  const restored = decodeCake(encodeCake({ ...initialCake, design3D: state }));
  assert.deepEqual(restored?.design3D, state);
  assert.deepEqual(decodeCake(encodeCake(initialCake)), initialCake);
});
test("all lettering fonts survive JSON and gift sharing, unknown font IDs are rejected", () => {
  for (const font of letteringFonts) {
    const design = { ...state, letteringFont: font.id };
    assert.deepEqual(JSON.parse(serializeCake3DState(design)), design);
    assert.equal(
      decodeCake(
        encodeCake({
          ...initialCake,
          letteringFont: font.id,
          design3D: design,
        }),
      )?.design3D?.letteringFont,
      font.id,
    );
  }
  assert.throws(() =>
    parseCake3DState({ ...state, letteringFont: "untrusted-font" }),
  );
  assert.equal(
    decodeCake(
      encodeCake({ ...initialCake, letteringFont: "unknown" } as never),
    ),
    null,
  );
});
test("lettering colors and positions survive JSON and gift links; malformed values fail", () => {
  for (const color of letteringColors)
    for (const position of letteringPositions) {
      const design = {
        ...state,
        letteringColor: color.value,
        letteringPosition: position.value,
      };
      assert.deepEqual(JSON.parse(serializeCake3DState(design)), design);
      const gift = decodeCake(
        encodeCake({
          ...initialCake,
          letteringColor: color.value,
          letteringPosition: position.value,
          design3D: design,
        }),
      );
      assert.equal(gift?.letteringColor, color.value);
      assert.deepEqual(gift?.design3D, design);
    }
  for (const invalid of [
    { letteringColor: "url(evil)" },
    { letteringColor: 13 },
    { letteringPosition: "back" },
    { letteringPosition: null },
  ])
    assert.throws(() => parseCake3DState({ ...state, ...invalid }));
});
test("reject unsupported schema, invalid geometry, colors and resource abuse", () => {
  for (const invalid of [
    { ...state, schemaVersion: 2 },
    { ...state, cake: { ...state.cake, radius: 100 } },
    { ...state, strokes: Array(25).fill(state.strokes[0]) },
    {
      ...state,
      strokes: [
        { ...state.strokes[0], points: Array(101).fill([0, 0.685, 0]) },
      ],
    },
    { ...state, strokes: [{ ...state.strokes[0], radius: Infinity }] },
    { ...state, strokes: [{ ...state.strokes[0], points: [[0, 0, 0]] }] },
    { ...state, toppings: [{ ...state.toppings[0], position: [NaN, 0, 0] }] },
    {
      ...state,
      strokes: [{ ...state.strokes[0], color: "url(https://example.com)" }],
    },
  ])
    assert.throws(() => parseCake3DState(invalid));
});
test("strip unknown properties, clone vectors, reject malformed shared state", () => {
  const parsed = parseCake3DState({ ...state, unknown: "discard" });
  assert.equal("unknown" in parsed, false);
  parsed.strokes[0].points[0][0] = 0.9;
  assert.equal(state.strokes[0].points[0][0], 0);
  assert.equal(
    decodeCake(
      encodeCake({
        ...initialCake,
        design3D: { ...state, schemaVersion: 2 } as unknown as Cake3DState,
      }),
    ),
    null,
  );
});
