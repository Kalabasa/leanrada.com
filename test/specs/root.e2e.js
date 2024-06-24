import { $, browser, expect } from "@wdio/globals";
import { setup, shoudHaveNavigation } from "../common.js";

describe("/", () => {
  beforeEach(async () => {
    await setup(browser, "/");
  });

  it("should have navigation", shoudHaveNavigation);

  it("passes visreg", async () => {
    await browser.checkFullPageScreen("full");
  });
});
