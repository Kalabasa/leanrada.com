import { browser } from "@wdio/globals";
import { setup } from "../../common.js";

describe("/wares/<post>/", () => {
  beforeEach(async () => {
    await setup(
      browser,
      "desktop",
      "/wares/wikawik/"
    );
  });

  it("passes visreg", async () => {
    await browser.checkFullPageScreen("wares-post-full");
  });
});
