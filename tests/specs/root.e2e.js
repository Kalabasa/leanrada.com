import { expect, browser, $ } from "@wdio/globals";
import { getURL } from "../common.js";

describe("/", () => {
  it("should have navigation", async () => {
    await browser.url(getURL("/"));
    const homeLink = $("a.=Home");
    const notesLink = $("a.=Notes");
    expect(homeLink).toBeExisting();
    expect(homeLink).toHaveAttr("href", "/");
    expect(notesLink).toBeExisting();
    expect(notesLink).toHaveAttr("href", "/notes/");
  });
});
