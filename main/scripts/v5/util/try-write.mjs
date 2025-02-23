import fs from "node:fs/promises";
import path from "node:path";
import { diffLines } from "diff";

export async function tryWrite({
  filePath,
  origText = undefined,
  text,
  verb,
  dryRun,
}) {
  const resolvedPath = path.resolve(filePath);
  const relativePath = path.relative(process.cwd(), resolvedPath);

  origText = origText ?? (await fs.readFile(resolvedPath));
  let removedLines = 0;
  let addedLines = 0;
  for (const change of diffLines(String(origText), String(text))) {
    if (change.added) {
      addedLines += change.count;
    }
    if (change.removed) {
      removedLines += change.count;
    }
  }
  const diffReport = `+${addedLines} -${removedLines} lines changed. `;
  
  if (addedLines === 0 && removedLines === 0) {
    console.log(`${diffReport}Ignoring:`, relativePath);
  } else {
    if (dryRun) {
      console.log(`${diffReport}Not ${verb}:`, relativePath);
    } else {
      console.log(
        diffReport + `${verb.slice(0, 1).toUpperCase() + verb.slice(1)}:`,
        relativePath
      );
      await fs.writeFile(resolvedPath, text);
    }
  }
}
