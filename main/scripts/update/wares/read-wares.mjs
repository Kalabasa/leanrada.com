import glob from "glob";
import path from "node:path";

export async function readWares(siteDir) {
  console.log("Reading wares...");
  const pages = glob.sync(path.resolve(siteDir, "wares", "*", "index.html"));

  const wares = await Promise.all(
    pages.map(async (page) => {
      const dir = path.dirname(page);
      const name = path.basename(dir);
      return {
        name,
        href: `/wares/${name}/`,
        public: !name.startsWith("_"),
      };
    })
  );

  console.log("Wares:", wares.length);
  return wares;
}
