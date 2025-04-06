import { browser, expect } from "@wdio/globals";
import { block, setup } from "../../common.js";

describe("/wares/<post>/", () => {
  beforeEach(async () => {
    await block(browser, ["**/wares/**/*.@(png|jpg|mp4)"]);
    await setup(browser, "desktop", "/wares/wikawik/");
  });

  it("passes visreg", async () => {
    await expect(browser).toMatchFullPageSnapshot("wares-post-full");
  });
});
