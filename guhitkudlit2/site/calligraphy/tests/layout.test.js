import test from "node:test";
import assert from "node:assert/strict";

import { layOut } from "../layout.js";

function v(x, y) {
  return { x, y, adjacency: new Map() };
}

test("empty input", () => {
  const result = layOut([]);
  assert.deepEqual(result, []);
});

test("single glyph unchanged (no offset)", () => {
  const g = [
    [v(0, 0), undefined],
    [undefined, v(1, 1)],
  ];

  const [out] = layOut([g]);

  assert.equal(out[0][0].x, 0);
  assert.equal(out[1][1].x, 1);
});

test("second glyph offset by width of first", () => {
  const g1 = [
    [v(0, 0), v(1, 0)], // width = 2
  ];
  const g2 = [
    [v(0, 0)],
  ];

  const [out1, out2] = layOut([g1, g2]);

  assert.equal(out1[0][0].x, 0);
  assert.equal(out1[0][1].x, 1);

  assert.equal(out2[0][0].x, 2);
});

test("cumulative offsets across multiple glyphs", () => {
  const g1 = [[v(0, 0)]]; // width = 1
  const g2 = [[v(0, 0), v(1, 0)]]; // width = 2
  const g3 = [[v(0, 0)]]; // should be offset by 3

  const [, , out3] = layOut([g1, g2, g3]);

  assert.equal(out3[0][0].x, 3);
});

test("handles sparse rows correctly in width calculation", () => {
  const g1 = [
    [undefined, undefined, v(2, 0)], // width = 3
  ];
  const g2 = [
    [v(0, 0)],
  ];

  const [, out2] = layOut([g1, g2]);

  assert.equal(out2[0][0].x, 3);
});

test("does not mutate original glyphs", () => {
  const g = [[v(0, 0)]];
  const originalX = g[0][0].x;

  const [out] = layOut([g]);

  assert.equal(g[0][0].x, originalX);
  assert.notEqual(out[0][0], g[0][0]); // cloned
});

test("preserves y and clones adjacency", () => {
  const adjacency = new Map([["mockKey", "mockValue"]]);
  const vertex = { x: 0, y: 5, adjacency };
  const g = [[vertex]];

  const [out] = layOut([g]);

  assert.equal(out[0][0].y, 5);

  // different reference
  assert.notEqual(out[0][0].adjacency, adjacency);

  // same content
  assert.deepEqual(
    Array.from(out[0][0].adjacency.entries()),
    Array.from(adjacency.entries())
  );
});

test("multiple rows contribute to width", () => {
  const g1 = [
    [v(0, 0)],
    [undefined, undefined, v(2, 1)], // width = 3
  ];
  const g2 = [[v(0, 0)]];

  const [, out2] = layOut([g1, g2]);

  assert.equal(out2[0][0].x, 3);
});