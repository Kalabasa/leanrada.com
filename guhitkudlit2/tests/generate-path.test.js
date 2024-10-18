import assert from "node:assert";
import { suite, test } from "node:test";
import {
  findComponents,
  toNodeSequence,
} from "../site/calligraphy/generate-path.js";

suite("findEdgeGroups", () => {
  test("Two disjoint sets", () => {
    const result = findComponents(
      [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }],
      [{ nodes: [1, 2] }, { nodes: [3, 4] }]
    );
    assert.strictEqual(result.length, 2);
  });

  test("One connected set", () => {
    const result = findComponents(
      [{ id: 1 }, { id: 2 }, { id: 3 }],
      [{ nodes: [1, 2] }, { nodes: [2, 3] }]
    );
    assert.strictEqual(result.length, 1);
  });

  test("Fully connected set", () => {
    const result = findComponents(
      [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }],
      [{ nodes: [1, 2] }, { nodes: [2, 3] }, { nodes: [3, 4] }]
    );
    assert.strictEqual(result.length, 1);
  });

  test("No edges", () => {
    const result = findComponents(
      [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }],
      []
    );
    assert.strictEqual(result.length, 4);
  });
});

suite("toNodeSequence", () => {
  test("Three nodes", () => {
    const result = Array.from(
      toNodeSequence(
        [{ id: 2 }, { id: 1 }, { id: 3 }],
        [{ nodes: [1, 2] }, { nodes: [2, 3] }]
      )
    );
    assertNodeSequence(result, [{ id: 1 }, { id: 2 }, { id: 3 }]);
  });

  test("Three nodes (shuffle)", () => {
    const result = Array.from(
      toNodeSequence(
        [{ id: 2 }, { id: 3 }, { id: 1 }],
        [{ nodes: [1, 2] }, { nodes: [2, 3] }]
      )
    );
    assertNodeSequence(result, [{ id: 1 }, { id: 2 }, { id: 3 }]);
  });

  test("Four nodes", () => {
    const result = Array.from(
      toNodeSequence(
        [{ id: 4 }, { id: 2 }, { id: 3 }, { id: 1 }],
        [{ nodes: [1, 2] }, { nodes: [2, 3] }, { nodes: [3, 4] }]
      )
    );
    assertNodeSequence(result, [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }]);
  });
});

function assertNodeSequence(sequence, expectedSequence) {
  try {
    assert.deepStrictEqual(sequence, expectedSequence);
  } catch (error1) {
    try {
      assert.deepStrictEqual(sequence, expectedSequence.reverse());
    } catch (error2) {
      throw error1.toString().length < error2.toString().length
        ? error1
        : error2;
    }
  }
}
