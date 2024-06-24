import { browser } from "@wdio/globals";
import { setup } from "../../common.js";

describe("/notes/<post>/", () => {
  beforeEach(async () => {
    await setup(
      browser,
      "desktop",
      "/notes/simple-image-recognition-vanilla-js/"
    );
  });

  it("passes visreg", async () => {
    await browser.checkFullPageScreen("notes-post-full");
  });
});
