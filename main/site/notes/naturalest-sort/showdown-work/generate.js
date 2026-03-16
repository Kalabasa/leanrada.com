import { wordSort } from "../demo/sort.js";
import { readFileSync } from "node:fs";

// Jim Palmer's naturalSort v0.8.1
// https://github.com/overset/javascript-natural-sort/blob/master/naturalSort.js
function naturalSort (a, b) {
    var re = /(^([+\-]?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?(?=\D|\s|$))|^0x[\da-fA-F]+$|\d+)/g,
        sre = /^\s+|\s+$/g,
        snre = /\s+/g,
        dre = /(^([\w ]+,?[\w ]+)?[\w ]+,?[\w ]+\d+:\d+(:\d+)?[\w ]?|^\d{1,4}[\/\-]\d{1,4}[\/\-]\d{1,4}|^\w+, \w+ \d+, \d{4})/,
        hre = /^0x[0-9a-f]+$/i,
        ore = /^0/,
        i = function(s) {
            return (naturalSort.insensitive && ('' + s).toLowerCase() || '' + s).replace(sre, '');
        },
        x = i(a),
        y = i(b),
        xN = x.replace(re, '\0$1\0').replace(/\0$/,'').replace(/^\0/,'').split('\0'),
        yN = y.replace(re, '\0$1\0').replace(/\0$/,'').replace(/^\0/,'').split('\0'),
        xD = parseInt(x.match(hre), 16) || (xN.length !== 1 && Date.parse(x)),
        yD = parseInt(y.match(hre), 16) || xD && y.match(dre) && Date.parse(y) || null,
        normChunk = function(s, l) {
            return (!s.match(ore) || l == 1) && parseFloat(s) || s.replace(snre, ' ').replace(sre, '') || 0;
        },
        oFxNcL, oFyNcL;
    if (yD) {
        if (xD < yD) { return -1; }
        else if (xD > yD) { return 1; }
    }
    for(var cLoc = 0, xNl = xN.length, yNl = yN.length, numS = Math.max(xNl, yNl); cLoc < numS; cLoc++) {
        oFxNcL = normChunk(xN[cLoc] || '', xNl);
        oFyNcL = normChunk(yN[cLoc] || '', yNl);
        if (isNaN(oFxNcL) !== isNaN(oFyNcL)) {
            return isNaN(oFxNcL) ? 1 : -1;
        }
        if (/[^\x00-\x80]/.test(oFxNcL + oFyNcL) && oFxNcL.localeCompare) {
            var comp = oFxNcL.localeCompare(oFyNcL);
            return comp / Math.abs(comp);
        }
        if (oFxNcL < oFyNcL) { return -1; }
        else if (oFxNcL > oFyNcL) { return 1; }
    }
}

const casesFile = new URL("./cases.txt", import.meta.url);
const cases = readFileSync(casesFile, "utf-8")
  .split("\n")
  .filter(line => line.trim());

const vibesortMap = new Map();
const vibesortArg = process.argv.find(a => a.startsWith("--vibesort="));
if (vibesortArg) {
  const vibesortFile = vibesortArg.slice("--vibesort=".length);
  for (const line of readFileSync(vibesortFile, "utf-8").trim().split("\n")) {
    const { input, sorted } = JSON.parse(line);
    vibesortMap.set(input, sorted);
  }
}

const rows = [];

for (const words of cases) {
  const list = words.split("|");
  const lexical = [...list].sort();
  const natural = [...list].sort(naturalSort);

  let naturaler;
  try {
    const result = await wordSort(list);
    naturaler = result.toSorted();
  } catch {
    naturaler = null;
  }

  const naturalest = vibesortMap.get(words) ?? null;

  rows.push({
    expected: list,
    lexical,
    natural,
    naturaler,
    naturalest,
  });
}

const methods = [
  { key: "lexical", label: "Array.sort" },
  { key: "natural", label: "naturalSort" },
  { key: "naturaler", label: "wordSort" },
  { key: "naturalest", label: "vibeSort" },
];

function isReversed(sorted, expected) {
  const rev = [...expected].reverse();
  return sorted.every((w, i) => w === rev[i]);
}

function isCorrect(sorted, expected) {
  if (!sorted) return null;
  if (sorted.every((w, i) => w === expected[i])) return "correct";
  if (isReversed(sorted, expected)) return "reversed";
  return "wrong";
}

function verdict(correct) {
  if (correct === null) return "N/A";
  if (correct === "correct") return "✅";
  if (correct === "reversed") return "🔁";
  return "❌";
}

function formatWords(words, newline) {
  const sep = words.some(w => w.includes(",")) ? ";" : ",";
  return words.join(sep + (newline ? "<br>" : " "));
}

function verdictCell(sorted, expected) {
  const correct = isCorrect(sorted, expected);
  const symbol = verdict(correct);
  if (!sorted) return `<td>${symbol}`;
  return `<td><details><summary>${symbol}</summary>${formatWords(sorted, true)}</details>`;
}

const headerCells = methods.map(m => `<th><code>${m.label}</code><br>(${m.key})`).join("")
let tableRows = "";
for (const row of rows) {
  const cells = methods.map(m => verdictCell(row[m.key], row.expected)).join("");
  tableRows += `  <tr><td>${formatWords(row.expected)}${cells}\n`;
}

console.log(`<table>
  <tr><th>Expected${headerCells}
${tableRows}</table>`);
