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
    block(browser, [
      "https://*.goatcounter.com/**",
      "https://*.goatcounter.com/**/.*",
      "**/components/nebula-animation/nebula-animation.js",
    ]),
  ]);

  return await browser.url(getURL(path));
}

export async function block(browser, patterns) {
  return Promise.all(
    patterns.map((pattern) =>
      browser.mock(pattern).then((mock) => mock.abort("BlockedByClient"))
    )
  );
}

export async function shoudHaveNavigation() {
  const homeLink = $("a.=Home");
  const notesLink = $("a.=Notes");
  await expect(homeLink).toBeExisting();
  await expect(homeLink).toHaveAttr("href", "/");
  await expect(notesLink).toBeExisting();
  await expect(notesLink).toHaveAttr("href", "/notes/");
}
