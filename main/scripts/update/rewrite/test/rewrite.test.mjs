import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { rewrite } from "../rewrite.mjs";

let tmpDir;
let tmpFile;

async function writeHTML(content) {
  tmpFile = path.join(tmpDir, "test.html");
  await fs.writeFile(tmpFile, content);
  return tmpFile;
}

async function readHTML() {
  return fs.readFile(tmpFile, "utf8");
}

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "rewrite-test-"));
});

afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true });
});

describe("rewrite", () => {
  it("replaces text content of data-rewrite elements", async () => {
    await writeHTML("<p><span data-rewrite='count'>old</span></p>");
    await rewrite({ htmlFilePath: tmpFile, data: { count: "42" } });
    assert.match(await readHTML(), /42/);
    assert.doesNotMatch(await readHTML(), /old/);
  });

  it("leaves element unchanged when data key is missing", async () => {
    await writeHTML("<p><span data-rewrite='missing'>keep</span></p>");
    await rewrite({ htmlFilePath: tmpFile, data: {} });
    assert.match(await readHTML(), /keep/);
  });

  it("leaves element unchanged when data value is undefined", async () => {
    await writeHTML("<p><span data-rewrite='x'>keep</span></p>");
    await rewrite({ htmlFilePath: tmpFile, data: { x: undefined } });
    assert.match(await readHTML(), /keep/);
  });

  it("handles multiple data-rewrite elements", async () => {
    await writeHTML(
      "<p><span data-rewrite='a'>old-a</span><span data-rewrite='b'>old-b</span></p>"
    );
    await rewrite({ htmlFilePath: tmpFile, data: { a: "new-a", b: "new-b" } });
    const result = await readHTML();
    assert.match(result, /new-a/);
    assert.match(result, /new-b/);
    assert.doesNotMatch(result, /old-a/);
    assert.doesNotMatch(result, /old-b/);
  });

  it("skips write when content is unchanged (dryRun)", async () => {
    await writeHTML("<p>hello</p>");
    const mtime = (await fs.stat(tmpFile)).mtimeMs;
    await rewrite({ htmlFilePath: tmpFile, data: {}, dryRun: true });
    const newMtime = (await fs.stat(tmpFile)).mtimeMs;
    assert.equal(mtime, newMtime);
  });
});

describe("rewrite", () => {
  it("allows custom element handlers via setup", async () => {
    await writeHTML('<p><img src="test.jpg"></p>');
    await rewrite({
      htmlFilePath: tmpFile,
      setup(r) {
        r.on("img", {
          element(el) {
            el.setAttribute("loading", "lazy");
          },
        });
      },
    });
    assert.match(await readHTML(), /loading="lazy"/);
  });
});
