const { spawn } = require("node:child_process");
const readline = require("node:readline/promises");
const http = require("node:http");
const url = require("node:url");

const PORT = 7786;
const REDIRECT_URI = `http://127.0.0.1:${PORT}/callback`;

main();

async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const clientID = await rl.question(`Client ID:`);
  const clientSecret = await rl.question(`Client secret:`);

  const authorization = launchAuthorizationCallbackServer();

  spawn("xdg-open", [
    "https://accounts.spotify.com/authorize" +
      `?client_id=${encodeURIComponent(clientID)}` +
      `&response_type=code` +
      `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
      `&scope=user-read-recently-played`,
  ]);

  const code = await authorization.codePromise;

  const tokenResponse = await fetch("https://accounts.spotify.com/api/token", {
    method: "post",
    body: new URLSearchParams({
      grant_type: "authorization_code",
      redirect_uri: REDIRECT_URI,
      code,
    }),
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization:
        "Basic " +
        Buffer.from(clientID + ":" + clientSecret).toString("base64"),
    },
  });
  const tokenResponseJson = await tokenResponse.json();

  console.log("refresh_token: " + tokenResponseJson.refresh_token);
  process.exit();
}

function launchAuthorizationCallbackServer() {
  const codePromise = new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const parsedUrl = url.parse(req.url, true);
      const path = parsedUrl.pathname;
      const query = parsedUrl.query;

      if (path === "/callback" && query.code) {
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(`
          <h1>Authentication Successful</h1>
          <p>You can close this window now.</p>
          <script>window.close()</script>
        `);
        server.closeAllConnections();
        server.close();
        resolve(query.code);
      } else {
        res.end();
      }
    });

    server.listen(PORT, () => {
      console.log(`Authorization callback server at http://127.0.0.1:${PORT}/`);
    });

    setTimeout(() => {
      console.error("Authorization callback timed out!");
      reject();
    }, 30_000);
  });

  return {
    codePromise,
  };
}
