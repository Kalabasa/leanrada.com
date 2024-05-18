// Usage: node download.js "filename1" "https://url1/" "file2" "https://url2/" [...]

const fs = require("fs");
const path = require("path");
const { default: Axios } = require("axios");

const args = process.argv.slice(2);

download();

async function download() {
  for (let i = 0; i <= args.length - 2; i += 2) {
    const name = args[i];
    const url = args[i + 1];
    const response = await Axios.get(url, { responseType: "blob" });
    const file = path.resolve(__dirname, "data", name);
    fs.writeFileSync(file, response.data);
    console.log("Downloaded " + file);
  }
}
