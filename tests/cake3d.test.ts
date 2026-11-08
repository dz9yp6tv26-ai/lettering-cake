import { test } from "node:test";
import assert from "node:assert/strict";
import {
  parseCake3DState,
  serializeCake3DState,
  presetToppings,
  type Cake3DState,
} from "../src/lib/cake3d";
import { initialCake, encodeCake, decodeCake } from "../src/lib/cake";
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
