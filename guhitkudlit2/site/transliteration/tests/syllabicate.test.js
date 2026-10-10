import test from "node:test";
import assert from "node:assert";
import { syllabicate } from "../syllabicate.js";

const cases = [
  // Karaniwan
  [
    ["aso"],
    {
      baybayinUnits: ["a", "su"],
      transformed: [
        {
          fromWord: "aso",
          toWord: "asu",
          transforms: [{ type: "vowel", from: "so", to: "su" }],
        },
      ],
    },
  ],
  [["pusa"], { baybayinUnits: ["pu", "sa"] }],
  [
    ["araw"],
    {
      baybayinUnits: ["a", "da", "w"],
      transformed: [
        {
          fromWord: "araw",
          toWord: "adaw",
          transforms: [{ type: "ra", from: "ra", to: "da" }],
        },
      ],
    },
  ],
  [
    ["elepante"],
    {
      baybayinUnits: ["i", "li", "pa", "n", "ti"],
      transformed: [
        {
          fromWord: "elepante",
          toWord: "ilipanti",
          transforms: [
            { type: "vowel", from: "e", to: "i" },
            { type: "vowel", from: "le", to: "li" },
            { type: "vowel", from: "te", to: "ti" },
          ],
        },
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
        {
          fromWord: "doon",
          toWord: "duun",
          transforms: [
            { type: "vowel", from: "do", to: "du" },
            { type: "vowel", from: "o", to: "u" },
          ],
        },
      ],
    },
  ],
  [["biik"], { baybayinUnits: ["bi", "i", "k"] }],
  [["kailan"], { baybayinUnits: ["ka", "i", "la", "n"] }],
  [
    ["baon"],
    {
      baybayinUnits: ["ba", "u", "n"],
      transformed: [
        {
          fromWord: "baon",
          toWord: "baun",
          transforms: [{ type: "vowel", from: "o", to: "u" }],
        },
      ],
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
        {
          fromWord: "bakka",
          toWord: "baka",
          transforms: [{ type: "repetition", from: "kk", to: "k" }],
        },
      ],
    },
  ],
  [["Pusà!"], { baybayinUnits: ["pu", "sa"] }],
  [
    ["aso pusa suri"],
    {
      baybayinUnits: ["a", "su", " ", "pu", "sa", " ", "su", "di"],
      transformed: [
        {
          fromWord: "aso",
          toWord: "asu",
          transforms: [{ type: "vowel", from: "so", to: "su" }],
        },
        {
          fromWord: "suri",
          toWord: "sudi",
          transforms: [{ type: "ra", from: "ri", to: "di" }],
        },
      ],
    },
  ],

  // Bigkas na iba sa baybay
  [
    ["ng"],
    {
      baybayinUnits: ["na", "ng"],
      transformed: [
        {
          fromWord: "ng",
          toWord: "nang",
          transforms: [{ type: "special", from: "ng", to: "nang" }],
        },
      ],
    },
  ],
  [
    ["mga"],
    {
      baybayinUnits: ["ma", "nga"],
      transformed: [
        {
          fromWord: "mga",
          toWord: "manga",
          transforms: [{ type: "special", from: "mga", to: "manga" }],
        },
      ],
    },
  ],
  [["ng", { simple: true }], { baybayinUnits: ["ng"] }],

  // Da at Ra
  [
    ["suri"],
    {
      baybayinUnits: ["su", "di"],
      transformed: [
        {
          fromWord: "suri",
          toWord: "sudi",
          transforms: [{ type: "ra", from: "ri", to: "di" }],
        },
      ],
    },
  ],
  [["suri", { separateRa: true }], { baybayinUnits: ["su", "ri"] }],
  [
    ["regalo"],
    {
      baybayinUnits: ["di", "ga", "lu"],
      transformed: [
        {
          fromWord: "regalo",
          toWord: "digalu",
          transforms: [
            { type: "vowel", from: "re", to: "di" },
            { type: "ra", from: "ri", to: "di" },
            { type: "vowel", from: "lo", to: "lu" },
          ],
        },
      ],
    },
  ],
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
        {
          fromWord: "bantay",
          toWord: "bata",
          transforms: [
            { type: "cluster", from: "n", to: "" },
            { type: "drop", from: "y", to: "" },
          ],
        },
      ],
    },
  ],
  [
    ["pr", { precolonial: true }],
    {
      baybayinUnits: ["pi"],
      transformed: [
        {
          fromWord: "pr",
          toWord: "pi",
          transforms: [
            { type: "cluster", from: "p", to: "pi" },
            { type: "drop", from: "r", to: "" },
          ],
        },
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
