export class InvalidLetterError extends Error {
  letters = [];

  constructor(letters) {
    super();
    if (!Array.isArray(letters)) throw new TypeError();
    this.letters = Array.from(
      new Set(letters.map((letter) => letter.replaceAll("<", ""))),
    );
  }

  formatLetters() {
    return (
      this.letters.slice(0, -1).join(", ").toUpperCase() +
      (this.letters.length === 1
        ? this.letters[0].toUpperCase()
        : this.letters.length === 2
          ? " and " + this.letters.at(-1).toUpperCase()
          : this.letters.length > 2
            ? ", and " + this.letters.at(-1).toUpperCase()
            : "")
    );
  }
}
