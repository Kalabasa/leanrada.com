import test from "node:test";
import assert from "node:assert";
import { syllabicate } from "../syllabicate.js";

const cases = [
  // Karaniwan
  [["aso"], ["a", "su"]],
  [["pusa"], ["pu", "sa"]],
  [["araw"], ["a", "da", "w"]],
  [["elepante"], ["i", "li", "pa", "n", "ti"]],
  [["bantay"], ["ba", "n", "ta", "y"]],
  [["daan"], ["da", "a", "n"]],
  [["doon"], ["du", "u", "n"]],
  [["biik"], ["bi", "i", "k"]],
  [["kailan"], ["ka", "i", "la", "n"]],
  [["baon"], ["ba", "u", "n"]],
  [["baul"], ["ba", "u", "l"]],
  [["kain"], ["ka", "i", "n"]],
  [["upuan"], ["u", "pu", "a", "n"]],

  // Bigkas na iba sa baybay
  [["ng"], ["na", "ng"]],
  [["mga"], ["ma", "nga"]],
  [["ng", { simple: true }], ["ng"]],

  // Da at Ra
  [["suri"], ["su", "di"]],
  [
    ["suri", { separateRa: true }],
    ["su", "ri"],
  ],
  [
    ["durian", { separateRa: true }],
    ["du", "ri", "a", "n"],
  ],
];

cases.forEach(([input, output], i) => {
  test(
    "syllabicate: " +
      input[0] +
      (input[1] ? ", " + JSON.stringify(input[1]) : ""),
    () => {
      assert.deepStrictEqual(syllabicate(...input), output);
    }
  );
});
