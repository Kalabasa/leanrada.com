import childProcess from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { getTopDir } from "./util/paths.js";

export function updateWorktree({ dir, branch }) {
  const absoluteTarget = path.resolve(dir);
  const repoRoot = getTopDir();

  const relative = path.relative(repoRoot, absoluteTarget);
  const parts = relative.split(path.sep);

  if (parts.length < 2 || relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`Worktree "${dir}" must be 2 levels deep within the repo root.`);
  }

  if (fs.existsSync(absoluteTarget)) {
    fs.rmSync(absoluteTarget, { recursive: true, force: true });
  }
  childProcess.execSync("git fetch", { stdio: "inherit" });
  childProcess.execSync(
    `git worktree add -f ${absoluteTarget} origin/${branch}`,
    { stdio: "inherit" }
  );
}

export function getGitExcludes(workingDir) {
  const stdout = childProcess.execSync(
    `git -C "${path.resolve(workingDir)}" ls-files --directory --others --ignored --exclude-standard -z`,
    { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }
  );
  return stdout.split('\0').filter(Boolean);
}
