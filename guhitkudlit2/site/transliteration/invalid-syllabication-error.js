export class InvalidSyllabicationError extends Error {
  word;

  constructor(word) {
    super();
    this.word = word;
  }
}
