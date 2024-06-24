import { $, browser, expect } from "@wdio/globals";
import { setup, shoudHaveNavigation } from "../common.js";

["desktop", "mobile"].forEach((platform) => {
  describe(`/ (${platform})`, () => {
    beforeEach(async () => {
      await setup(browser, platform, "/");
    });

    it("should have navigation", shoudHaveNavigation);
  });
});
