export interface Env {
  data: KVNamespace;
}

const MASTER_KEY = "v2";
const CURRENT_SCHEMA_VERSION = "v2";
const GET_PAGE_SIZE = 20;

type GetRequest = {
  page: number;
};

type SubmitRequest = {
  schemaVersion: string;
  text: string;
  name?: string;
  fontIndex?: number;
  bgStyleIndex?: number;
  bgRGB?: number;
  fgRGB?: number;
  stamps?: Array<{ typeIndex: number; seed: number; x: number; y: number }>;
};

type StoredData = {
  messages?: Array<StoredMessage>;
};

type StoredMessage = {
  schemaVersion?: string;
  createdUnixTime?: number;
  text?: string;
  name?: string;
  fontIndex?: number;
  bgStyleIndex?: number;
  bgRGB?: number;
  fgRGB?: number;
  stamps?: Array<{ typeIndex: number; seed: number; x: number; y: number }>;
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

  const data = await getData(env);

  if (!data.messages) {
    return new Response(JSON.stringify([]));
  }

  const slice = data.messages.slice(
    getRequest.page * GET_PAGE_SIZE,
    (getRequest.page + 1) * GET_PAGE_SIZE
  );

  return new Response(JSON.stringify(slice));
}

async function handlePost(request: Request, env: Env) {
  const submitRequest: Partial<SubmitRequest> = await request.json();
  console.log("Handling POST request:", submitRequest);
  checkSubmitRequest(submitRequest);

  const now = new Date();
  const data = await getData(env);
  const snapshot = structuredClone(data);

  data.messages = data.messages || [];
  data.messages.unshift({
    schemaVersion: submitRequest.schemaVersion,
    createdUnixTime: Math.floor(now.getTime() / 1000),
    text: String(submitRequest.text),
    name: submitRequest.name && String(submitRequest.name),
    fontIndex: numberOrUndefined(submitRequest.fontIndex),
    bgStyleIndex: numberOrUndefined(submitRequest.bgStyleIndex),
    bgRGB: numberOrUndefined(submitRequest.bgRGB),
    fgRGB: numberOrUndefined(submitRequest.fgRGB),
    stamps: (submitRequest.stamps || []).map((stamp) => ({
      typeIndex: stamp.typeIndex,
      seed: stamp.seed,
      x: stamp.x,
      y: stamp.y,
    })),
  });

  const snapshotName =
    "snapshot-" +
    now.getFullYear() +
    "-" +
    String(now.getUTCMonth() + 1).padStart(2, "0") +
    "-" +
    String(now.getUTCDate()).padStart(2, "0");

  await Promise.all([
    env.data.put(snapshotName, JSON.stringify(snapshot)),
    env.data.put(MASTER_KEY, JSON.stringify(data)),
  ]);

  return new Response(null);
}

async function getData(env: Env): Promise<StoredData> {
  let data: StoredData | null = await env.data.get(MASTER_KEY, {
    type: "json",
  });

  if (!data) {
    console.log("New blank data");
    data = {};
  }

  return data;
}

function checkGetRequest(getRequest: any): asserts getRequest is GetRequest {
  if (!Number.isInteger(getRequest.page))
    throw new TypeError("getRequest.page is not an integer");
}

function checkSubmitRequest(
  submitRequest: any
): asserts submitRequest is SubmitRequest {
  if (submitRequest.version !== CURRENT_SCHEMA_VERSION)
    throw new TypeError("submitRequest.version is unsupported");
  if (!submitRequest.text) throw new TypeError("submitRequest.text is empty");
  if (typeof submitRequest.text !== "string")
    throw new TypeError("submitRequest.text is not a string");
  if (submitRequest.name != undefined && typeof submitRequest.name !== "string")
    throw new TypeError("submitRequest.name is not a string");
  if (
    submitRequest.fontIndex != undefined &&
    !Number.isInteger(submitRequest.fontIndex)
  )
    throw new TypeError("submitRequest.fontIndex is not an integer");
  if (
    submitRequest.bgStyleIndex != undefined &&
    !Number.isInteger(submitRequest.bgStyleIndex)
  )
    throw new TypeError("submitRequest.bgStyleIndex is not an integer");
  if (
    submitRequest.bgRGB != undefined &&
    !Number.isInteger(submitRequest.bgRGB)
  )
    throw new TypeError("submitRequest.bgRGB is not an integer");
  if (
    submitRequest.fgRGB != undefined &&
    !Number.isInteger(submitRequest.fgRGB)
  )
    throw new TypeError("submitRequest.fgRGB is not an integer");

  for (const stamp of submitRequest.stamps || []) {
    if (stamp.typeIndex != undefined && !Number.isInteger(stamp.typeIndex))
      throw new TypeError("stamp.typeIndex is not an integer");
    if (stamp.seed != undefined && !Number.isInteger(stamp.seed))
      throw new TypeError("stamp.seed is not an integer");
    if (stamp.x != undefined && typeof stamp.x !== "number")
      throw new TypeError("stamp.x is not an number");
    if (stamp.y != undefined && typeof stamp.y !== "number")
      throw new TypeError("stamp.y is not an number");
  }
}

function numberOrUndefined(number: any): number | undefined {
  const value = Number(number);
  if (Number.isNaN(value)) return undefined;
  return value;
}

export default { fetch: handleRequest };
