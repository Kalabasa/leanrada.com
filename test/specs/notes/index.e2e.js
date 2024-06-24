import { $, browser, expect } from "@wdio/globals";
import { setup, shoudHaveNavigation } from "../../common.js";

describe("/notes/", () => {
  beforeEach(async () => {
    await setup(browser, "/notes/");
  });

  it("should have navigation", shoudHaveNavigation);
});
