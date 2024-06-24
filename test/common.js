import { $, expect } from "@wdio/globals";

export const devServer = "http://localhost:4567";

export function getURL(path) {
  if (!path.startsWith("/")) throw new Error("Invalid path!");
  return devServer + path;
}

const windowSizes = {
  mobile: [412, 915],
  desktop: [1366, 768],
};

export async function setup(browser, platform, path) {
  await Promise.all([
    browser.setWindowSize(...windowSizes[platform]),
    await browser
      .mock("https://*.goatcounter.com/**")
      .then((mock) => mock.abort("BlockedByClient")),
  ]);

  return await browser.url(getURL(path));
}

export async function shoudHaveNavigation() {
  const homeLink = $("a.=Home");
  const notesLink = $("a.=Notes");
  await expect(homeLink).toBeExisting();
  await expect(homeLink).toHaveAttr("href", "/");
  await expect(notesLink).toBeExisting();
  await expect(notesLink).toHaveAttr("href", "/notes/");
}
