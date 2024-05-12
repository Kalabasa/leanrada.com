import chalk from "chalk";

export function colorInfo(str) {
  return chalk.yellowBright(str);
}

export function colorPrompt(str) {
  return chalk.cyanBright(str);
}

export function colorQuote(str) {
  return chalk.greenBright(str);
}

export function colorError(str) {
  return chalk.redBright(str);
}
