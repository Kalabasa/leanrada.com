export class InvalidLetterError extends Error {
  constructor(letters) {
    super();
    this.letters = letters;
  }

  formatLetters() {
    return Array.from(new Set(this.letters))
      .join(", ")
      .replace("<", "") // sanitize
      .toUpperCase();
  }

  generateLetterExamples() {
    return generateLetterExamples(this.letters);
  }
}

const letterExamples = {
  c: [
    ["<del>C</del>at", "<ins>K</ins>at"],
    ["Bra<del>c</del>e", "Brey<ins>s</ins>"],
    ["O<del>c</del>ean", "Ow<ins>sy</ins>an"],
    ["<del>Ch</del>art", "<ins>Ts</ins>art"],
    ["<del>Ch</del>rome", "<ins>K</ins>rowm"],
  ],
  f: [["<del>F</del>ootball", "<ins>P</ins>utbol"]],
  j: [
    ["<del>J</del>eepney", "<ins>Dy</ins>ipni"],
    ["Mo<del>j</del>ito", "Mo<ins>h</ins>ito"],
    ["F<del>j</del>ord", "P<ins>y</ins>ord"],
  ],
  q: [
    ["<del>Q</del>ueen", "<ins>K</ins>win"],
    ["Uni<del>q</del>ue", "Yuni<ins>k</ins>"],
  ],
  v: [
    ["<del>V</del>ase", "<ins>B</ins>eys"],
    ["Ali<del>v</del>e", "Alay<ins>b</ins>"],
  ],
  x: [
    ["Bo<del>x</del>", "Ba<ins>ks</ins>"],
    ["<del>X</del>ero<del>x</del>", "<ins>S</ins>ero<ins>ks</ins>"],
    ["<del>X</del>ylophone", "<ins>S</ins>aylopon"],
  ],
  z: [
    ["<del>Z</del>oo", "<ins>S</ins>u"],
    ["Ama<del>z</del>ing", "Amey<ins>s</ins>ing"],
  ],
};

function generateLetterExamples(letters) {
  return Array.from(new Set(letters))
    .flatMap((l) =>
      letterExamples[l].map(
        ([before, after]) =>
          "<li><span class='before'>" +
          before +
          "</span>→<span class='after'>" +
          after +
          "</span></li>"
      )
    )
    .sort()
    .join("");
}
