import { $, expect } from "@wdio/globals";

export const devServer = "http://localhost:4567";

export function getURL(path) {
  if (!path.startsWith("/")) throw new Error("Invalid path!");
  return devServer + path;
}

export async function setup(browser, path) {
  return await Promise.all([
    browser.url(getURL(path)),
    browser.setWindowSize(1366, 768),
  ]);
}

export async function shoudHaveNavigation() {
  const homeLink = $("a.=Home");
  const notesLink = $("a.=Notes");
  expect(homeLink).toBeExisting();
  expect(homeLink).toHaveAttr("href", "/");
  expect(notesLink).toBeExisting();
  expect(notesLink).toHaveAttr("href", "/notes/");
}
