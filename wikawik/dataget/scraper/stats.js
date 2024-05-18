const INDEX_URL =
  "https://psa.gov.ph/population-and-housing/statistical-tables/2010";

const content = document.getElementsByTagName("div")[0];

display("Loading");

axios
  .get(INDEX_URL, { responseType: "document" })
  .then((response) => {
    display(response.data.body.innerHTML);
    const subPageURLs = findSubPageURLs(response.data);
    return Promise.all(
      subPageURLs.map((subPageURL) => {
        return axios
          .get(subPageURL, { responseType: "document" })
          .then((response) => {
            display(response.data.body.innerHTML);
            const sheet = findSheet(response.data);
            return sheet;
          });
      })
    );
  })
  .then((sheets) => {
    sheets = sheets.filter((s) => s);

    display("");
    sheets.forEach((sheet, i) => {
      setTimeout(() => {
        const a = document.createElement("a");
        a.textContent = ` [${sheet.name}] `;
        a.download = sheet.name;
        a.href = sheet.url;
        document.body.appendChild(a);
        a.click();
      }, i * 1000);
    });

    // display(
    //   "node download.js " +
    //     sheets.map((sheet) => `"${sheet.name}" "${sheet.url}"`).join(" ")
    // );
  });

/**
 * @param {Document} indexDocument
 *
 * @returns {string[]} URLs
 */
function findSubPageURLs(indexDocument) {
  const tableAnchors = indexDocument.querySelectorAll(
    "td a[href*=statistical-tables]"
  );
  return [...tableAnchors].map((a) => a.href);
}

/**
 * @param {Document} subPageDocument
 *
 * @returns {{name: string, url: string}?} sheet
 */
function findSheet(subPageDocument) {
  const sheetAnchor = subPageDocument.querySelector("a[href*=xlsx]");
  return (
    sheetAnchor && { name: sheetAnchor.textContent, url: sheetAnchor.href }
  );
}

/**
 * @param {string} text
 */
function display(text) {
  content.textContent = text;
}
