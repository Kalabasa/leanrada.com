import { browser } from "@wdio/globals";
import { setup } from "../../common.js";

describe("/art/", () => {
  beforeEach(async () => {
    await setup(
      browser,
      "desktop",
      "/art/"
    );
  });

  it("passes visreg", async () => {
    await expect(browser).toMatchFullPageSnapshot("art-full");
  });
});
