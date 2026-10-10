import test from "node:test";
import assert from "node:assert";
import { syllabicate } from "../syllabicate.js";

const cases = [
  // Karaniwan
  [
    ["aso"],
    {
      baybayinUnits: ["a", "su"],
      transformed: [{ type: "vowel", from: "o", to: "u", context: "aso" }],
    },
  ],
  [["pusa"], { baybayinUnits: ["pu", "sa"] }],
  [
    ["araw"],
    {
      baybayinUnits: ["a", "da", "w"],
      transformed: [{ type: "ra", from: "ra", to: "da", context: "araw" }],
    },
  ],
  [
    ["elepante"],
    {
      baybayinUnits: ["i", "li", "pa", "n", "ti"],
      transformed: [
        { type: "vowel", from: "e", to: "i", context: "elepante" },
        { type: "vowel", from: "e", to: "i", context: "elepante" },
        { type: "vowel", from: "e", to: "i", context: "elepante" },
      ],
    },
  ],
  [["bantay"], { baybayinUnits: ["ba", "n", "ta", "y"] }],
  [["daan"], { baybayinUnits: ["da", "a", "n"] }],
  [
    ["doon"],
    {
      baybayinUnits: ["du", "u", "n"],
      transformed: [
        { type: "vowel", from: "o", to: "u", context: "doon" },
        { type: "vowel", from: "o", to: "u", context: "doon" },
      ],
    },
  ],
  [["biik"], { baybayinUnits: ["bi", "i", "k"] }],
  [["kailan"], { baybayinUnits: ["ka", "i", "la", "n"] }],
  [
    ["baon"],
    {
      baybayinUnits: ["ba", "u", "n"],
      transformed: [{ type: "vowel", from: "o", to: "u", context: "baon" }],
    },
  ],
  [["baul"], { baybayinUnits: ["ba", "u", "l"] }],
  [["kain"], { baybayinUnits: ["ka", "i", "n"] }],
  [["upuan"], { baybayinUnits: ["u", "pu", "a", "n"] }],
  [
    ["bakka"],
    {
      baybayinUnits: ["ba", "ka"],
      transformed: [
        { type: "repetition", from: "kk", to: "k", context: "bakka" },
      ],
    },
  ],
  [["Pusà!"], { baybayinUnits: ["pu", "sa"] }],

  // Bigkas na iba sa baybay
  [
    ["ng"],
    {
      baybayinUnits: ["na", "ng"],
      transformed: [
        { type: "special", from: "ng", to: "nang", context: "ng" },
      ],
    },
  ],
  [
    ["mga"],
    {
      baybayinUnits: ["ma", "nga"],
      transformed: [
        { type: "special", from: "mga", to: "manga", context: "mga" },
      ],
    },
  ],
  [["ng", { simple: true }], { baybayinUnits: ["ng"] }],

  // Da at Ra
  [
    ["suri"],
    {
      baybayinUnits: ["su", "di"],
      transformed: [{ type: "ra", from: "ri", to: "di", context: "suri" }],
    },
  ],
  [["suri", { separateRa: true }], { baybayinUnits: ["su", "ri"] }],
  [
    ["durian", { separateRa: true }],
    { baybayinUnits: ["du", "ri", "a", "n"] },
  ],

  // Precolonial
  [
    ["bantay", { precolonial: true }],
    {
      baybayinUnits: ["ba", "ta"],
      transformed: [
        { type: "drop", from: "n", to: "", context: "bantay" },
        { type: "drop", from: "y", to: "", context: "bantay" },
      ],
    },
  ],
  [
    ["pr", { precolonial: true }],
    {
      baybayinUnits: ["pi"],
      transformed: [
        { type: "collapse", from: "p", to: "pi", context: "pr" },
        { type: "drop", from: "r", to: "", context: "pr" },
      ],
    },
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
