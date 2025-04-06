import { browser } from "@wdio/globals";
import { block, setup } from "../../common.js";

describe("/notes/<post>/", () => {
  beforeEach(async () => {
    await block(browser, ["**/notes/**/*.@(png|jpg|mp4)"]);
    await setup(
      browser,
      "desktop",
      "/notes/simple-image-recognition-vanilla-js/"
    );
  });

  it("passes visreg", async () => {
    await expect(browser).toMatchFullPageSnapshot("notes-post-full");
  });
});
