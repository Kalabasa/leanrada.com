import test from "node:test";
import assert from "node:assert/strict";

import { A, I, U, B, K, D, G, H, L, M, N, P, S, T, W, Y } from "../glyphs.js";

function vertices(grid) {
  return grid.flat().filter(Boolean);
}

function degrees(grid) {
  return vertices(grid)
    .map((v) => v.adjacency.size)
    .sort((a, b) => a - b);
}

function edgeTypes(grid) {
  const types = new Set();
  for (const v of vertices(grid)) {
    for (const [, e] of v.adjacency) {
      if (e.type) types.add(e.type);
    }
  }
  return types;
}

test("basic vertex counts", () => {
  assert.equal(vertices(I).length, 4);
  assert.equal(vertices(U).length, 3);
  assert.equal(vertices(H).length, 2);
});

test("symmetry for all glyphs", () => {
  for (const g of [A, I, U, B, K, D, G, H, L, M, N, P, S, T, W, Y]) {
    for (const v of vertices(g)) {
      for (const [u, e] of v.adjacency) {
        assert.ok(u.adjacency.has(v), "missing reverse edge");
      }
    }
  }
});

test("no self loops", () => {
  for (const g of [A, I, U, B, K, D, G, H, L, M, N, P, S, T, W, Y]) {
    for (const v of vertices(g)) {
      assert.ok(!v.adjacency.has(v));
    }
  }
});

test("degrees", () => {
  assert.deepEqual(degrees(I), [1, 1, 1, 1]);
  assert.deepEqual(degrees(U), [1, 1, 2]);
});

test("wavy edges detected", () => {
  const typesI = edgeTypes(I);
  assert.ok(typesI.has("wavy"));
  const typesL = edgeTypes(L);
  assert.ok(typesL.has("wavy"));
});

test("curve edges detected", () => {
  const typesU = edgeTypes(U);
  assert.ok(typesU.has("rightCurve"));
});
