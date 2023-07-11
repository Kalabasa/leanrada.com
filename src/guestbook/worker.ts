// MVP version. See if anybody uses the guestbook at all before making a proper system.
// todo: Top-level config for PAGE_WIDTH, PAGE_HEIGHT, MAX_PAGE for client code and worker code
// todo: Better concurrent editing by multiple users
//   - idea: separate data into one key per line (~320 entries in KV)
// todo: Better UX

export interface Env {
  data: KVNamespace;
}

// Must be constant forever
const PAGE_WIDTH = 40;
const PAGE_HEIGHT = 30;
// Must sync with client (or make a top-level config)
const MAX_PAGE = 8;
const TEMPLATE_URL =
  "https://raw.githubusercontent.com/Kalabasa/kalabasa.github.io/src/src/site/guestbook/template.json";

type GetRequest = {
  page: number;
};

type SubmitRequest = {
  page: number;
  content: string;
};

async function handleRequest(
  request: Request,
  env: Env,
  ctx: ExecutionContext
): Promise<Response> {
  try {
    const response = handleRequestMethod(request, env);
    (await response).headers.append(
      "Access-Control-Allow-Origin",
      "https://leanrada.com"
    );
    return response;
  } catch (e) {
    // don’t care about status codes for this worker
    console.error(
      "Returning 404 due to",
      e instanceof Error
        ? e.name + ": " + e.message.slice(0, 70).replaceAll(/\s/g, " ")
        : " unknown error"
    );
    return new Response(null, { status: 404 });
  }
}

async function handleRequestMethod(request: Request, env: Env) {
  if (request.method == "GET") return await handleGet(request, env);
  else if (request.method == "POST") return await handlePost(request, env);
  else throw new Error("Wrong HTTP method");
}

async function handleGet(request: Request, env: Env) {
  const url = new URL(request.url);
  const getRequest = {
    page: Number.parseInt(url.searchParams.get("page")!, 10),
  };
  console.log("Handling GET request:", getRequest);
  checkGetRequest(getRequest);

  let data = await env.data.get("master", { type: "json" });
  if (data) {
    checkData(data, "-master");
  } else {
    console.log("Get data from template");
    data = await fetch(TEMPLATE_URL).then((r) => r.json());
    checkData(data, "-template");
  }

  const slice = data.slice(
    getRequest.page * PAGE_HEIGHT,
    (getRequest.page + 1) * PAGE_HEIGHT
  );

  return new Response(JSON.stringify(slice));
}

async function handlePost(request: Request, env: Env) {
  const submitRequest: Partial<SubmitRequest> = await request.json();
  console.log("Handling POST request:", submitRequest);
  checkSubmitRequest(submitRequest);

  let data = await env.data.get("master", { type: "json" });
  if (data) {
    checkData(data, "-master");
  } else {
    console.log("New data from template");
    data = await fetch(TEMPLATE_URL).then((r) => r.json());
    checkData(data, "-template");
  }

  const newContent = submitRequest.content.split("\n");
  const offset = submitRequest.page * PAGE_HEIGHT;
  console.log("Splicing at", offset, ":");
  console.log("----------------------------------------");
  console.log(newContent.join("\n"));
  console.log("----------------------------------------");
  data.splice(offset, PAGE_HEIGHT, ...newContent);
  checkData(data, "-spliced");

  await env.data.put("master", JSON.stringify(data));

  return new Response(null);
}

function checkGetRequest(getRequest: any): asserts getRequest is GetRequest {
  if (!Number.isInteger(getRequest.page))
    throw new TypeError("getRequest.page is not an integer");
  if (getRequest.page < 0 || getRequest.page > MAX_PAGE)
    throw new TypeError("getRequest.page is out of valid range");
}

function checkSubmitRequest(
  submitRequest: any
): asserts submitRequest is SubmitRequest {
  if (!Number.isInteger(submitRequest.page))
    throw new TypeError("submitRequest.page is not an integer");
  if (submitRequest.page < 0 || submitRequest.page > MAX_PAGE)
    throw new TypeError("submitRequest.page is out of valid range");
  if (typeof submitRequest.content !== "string")
    throw new TypeError("submitRequest is missing content");
  if (
    submitRequest.content.length !==
    PAGE_WIDTH * PAGE_HEIGHT + (PAGE_HEIGHT - 1)
  )
    throw new TypeError("submitRequest.content is malformed");
  if (submitRequest.content.split("\n").length !== PAGE_HEIGHT)
    throw new TypeError("submitRequest.content is malformed");
}

function checkData(data: any, suffix?: string): asserts data is string[] {
  const name = "data" + suffix;
  if (!Array.isArray(data)) throw new TypeError(`${name} is not an array!`);
  if (!data.every((i) => typeof i === "string"))
    throw new TypeError(`${name} is not an array of strings!`);
  if (data.length !== PAGE_HEIGHT * MAX_PAGE)
    throw new TypeError(
      `${name} is not an array with MAX_PAGE * PAGE_HEIGHT items!`
    );
  if (!data.every((i) => i.length === PAGE_WIDTH))
    throw new TypeError(
      `${name} is not an array of PAGE_WIDTH length strings!`
    );
}

export default { fetch: handleRequest };
