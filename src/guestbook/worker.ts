export interface Env {
  data: KVNamespace;
}

const MASTER_KEY = "v2";
const CURRENT_SCHEMA_VERSION = "v2";
const GET_PAGE_SIZE = 100;
const MAX_STAMPS = 4;

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
  stampTypes?: number | number[];
  stampXs?: number | number[];
  stampYs?: number | number[];
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
  stamps?: Array<{ typeIndex: number; x: number; y: number }>;
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
    return new Response("Error", { status: 404 });
  }
}

async function handleRequestMethod(request: Request, env: Env) {
  if (new URL(request.url).pathname !== "/api") {
    return new Response(null, { status: 404 });
  }
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
  const submitRequest: Partial<SubmitRequest> = parseFormData(
    await request.formData()
  );
  console.log("Handling POST request:", submitRequest);
  checkSubmitRequest(submitRequest);
  const stampXs = arrayField(submitRequest.stampXs);
  const stampYs = arrayField(submitRequest.stampYs);

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
    stamps: arrayField(submitRequest.stampTypes)
      .slice(0, Math.min(stampXs.length, stampYs.length, MAX_STAMPS))
      .map((typeIndex, index) => ({
        typeIndex: typeIndex,
        x: stampXs[index],
        y: stampYs[index],
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

  return new Response(
    null,
    Response.redirect("https://leanrada.com/guestbook/")
  );
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
  if (submitRequest.schemaVersion !== CURRENT_SCHEMA_VERSION)
    throw new TypeError("submitRequest.schemaVersion is unsupported");
  if (!submitRequest.text) throw new TypeError("submitRequest.text is empty");
  if (typeof submitRequest.text !== "string")
    throw new TypeError("submitRequest.text is not a string");
  if (submitRequest.name != undefined && typeof submitRequest.name !== "string")
    throw new TypeError("submitRequest.name is not a string");
  if (
    submitRequest.fontIndex != undefined &&
    !Number.isInteger(parseInt(submitRequest.fontIndex, 10))
  )
    throw new TypeError("submitRequest.fontIndex is not an integer");
  if (
    submitRequest.bgStyleIndex != undefined &&
    !Number.isInteger(parseInt(submitRequest.bgStyleIndex, 10))
  )
    throw new TypeError("submitRequest.bgStyleIndex is not an integer");
  if (
    submitRequest.bgRGB != undefined &&
    !Number.isInteger(parseInt(submitRequest.bgRGB, 10))
  )
    throw new TypeError("submitRequest.bgRGB is not an integer");
  if (
    submitRequest.fgRGB != undefined &&
    !Number.isInteger(parseInt(submitRequest.fgRGB, 10))
  )
    throw new TypeError("submitRequest.fgRGB is not an integer");

  const stampTypes = arrayField(submitRequest.stampTypes);
  const stampXs = arrayField(submitRequest.stampXs);
  const stampYs = arrayField(submitRequest.stampYs);

  if (
    stampTypes.length !== stampXs.length ||
    stampTypes.length !== stampYs.length
  )
    throw new TypeError("submitRequest.stamp*s not equal in length");
  for (const type of stampTypes)
    if (type != undefined && !Number.isInteger(parseInt(type, 10)))
      throw new TypeError("stampTypes[] is not an integer");
  for (const x of stampXs)
    if (x != undefined && isNaN(x))
      throw new TypeError("stampXs[] is not an number");
  for (const y of stampYs)
    if (y != undefined && isNaN(y))
      throw new TypeError("stampYs[] is not an number");
}

function parseFormData(formData: FormData): Record<string, any> {
  const object: Record<string, any> = {};
  for (const key of formData.keys()) {
    object[key] = formData.getAll(key);
    if (object[key].length === 1) object[key] = object[key][0];
  }
  return object;
}

function arrayField<T>(value: undefined | T | T[]): T[] {
  return value == null ? [] : Array.isArray(value) ? value : [value];
}

function numberOrUndefined(number: any): number | undefined {
  const value = Number(number);
  if (Number.isNaN(value)) return undefined;
  return value;
}

export default { fetch: handleRequest };
