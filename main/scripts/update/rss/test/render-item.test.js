import { describe, it } from "node:test";
import assert from "node:assert/strict";
import * as cheerio from "cheerio";
import { renderItem } from "../render-item.js";

const defaults = {
  pageHref: "/notes/test-post/",
  title: "Test Post",
  date: new Date("2025-01-15"),
  domain: "leanrada.com",
};

function render(mainInnerHTML) {
  return renderItem({ ...defaults, mainInnerHTML });
}

function descriptionHtml(mainInnerHTML) {
  const xml = render(mainInnerHTML);
  const match = xml.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/);
  return match[1];
}

function description(mainInnerHTML) {
  return cheerio.load(descriptionHtml(mainInnerHTML));
}

describe("renderItem", () => {
  it("wraps output in an <item> with correct metadata", () => {
    const result = render("<p>Hello</p>");
    const ch = cheerio.load(result, { xml: true });
    assert.equal(ch("title").text(), "Test Post");
    assert.equal(ch("pubDate").text(), "Wed, 15 Jan 2025 00:00:00 GMT");
    assert.ok(ch("link").text().includes("leanrada.com/notes/test-post/"));
    assert.ok(ch("link").text().includes("ref=rss"));
  });

  it("removes style and script tags", () => {
    const ch = description("<style>.x{}</style><script>alert(1)</script><p>kept</p>");
    assert.equal(ch("style").length, 0);
    assert.equal(ch("script").length, 0);
    assert.equal(ch("p").text(), "kept");
  });

  it("removes data-rss=hidden elements", () => {
    const ch = description('<p>visible</p><div data-rss="hidden">secret</div>');
    assert.ok(!ch.text().includes("secret"));
    assert.equal(ch("p").text(), "visible");
  });

  it("flattens custom elements", () => {
    const ch = description("<custom-tag><p>inside</p></custom-tag>");
    assert.equal(ch("custom-tag").length, 0);
    assert.equal(ch("p").text(), "inside");
  });

  it("flattens nested custom elements", () => {
    const ch = description("<outer-tag><inner-tag><p>text</p></inner-tag></outer-tag>");
    assert.equal(ch("outer-tag").length, 0);
    assert.equal(ch("inner-tag").length, 0);
    assert.equal(ch("p").text(), "text");
  });

  it("resolves relative image src to absolute URLs", () => {
    const ch = description('<img src="photo.png">');
    assert.equal(ch("img").attr("src"), "https://leanrada.com/notes/test-post/photo.png?ref=rss");
  });

  it("resolves relative href to absolute URLs", () => {
    const ch = description('<a href="../other/">link</a>');
    assert.equal(ch("a").attr("href"), "https://leanrada.com/notes/other?ref=rss");
  });

  it("preserves absolute URLs", () => {
    const ch = description('<a href="https://example.com">link</a>');
    assert.equal(ch("a").attr("href"), "https://example.com");
  });

  it("adds interactive content notice for iframes", () => {
    const ch = description('<iframe src="https://example.com"></iframe>');
    assert.ok(ch.text().includes("Interactive content"));
    assert.equal(ch("iframe").length, 0);
  });

  it("adds interactive content notice for data-rss=interactive", () => {
    const ch = description('<p data-rss="interactive" aria-label="Demo">content</p>');
    assert.ok(ch.text().includes("Interactive content"));
    assert.ok(ch.text().includes("Alternative text: Demo"));
  });

  it("adds interactive content notice for data-rss=interactive", () => {
    const ch = description('<p data-rss="interactive" alt="Demo">content</p>');
    assert.ok(ch.text().includes("Interactive content"));
    assert.ok(ch.text().includes("Alternative text: Demo"));
  });
});
