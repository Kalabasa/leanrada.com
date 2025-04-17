import { shouldEvictSnapshot } from "./evict";
import { checkSpam } from "./spam";

export interface Env {
  data: KVNamespace;
  notify: SendEmail;
  enable_snapshot_eviction: unknown;
  enable_notification_email: unknown;
}

const MASTER_KEY = "v3";
const CURRENT_SCHEMA_VERSION = "v3";
const GET_PAGE_SIZE = 100;
const MAX_STAMPS = 4;

type GetRequest = {
  page: number;
};

export type SubmitRequest = {
  schemaVersion: string;
  text: string;
  name?: string;
  website?: string;
  timeSpentMs?: string;
  fontIndex?: string;
  bgStyleIndex?: string;
  bgRGB?: string;
  fgRGB?: string;
  stampTypes?: string | string[];
  stampXs?: string | string[];
  stampYs?: string | string[];
};

type StoredMessageRow = {
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
    const response = handleRequestMethod(request, env, ctx);
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

async function handleRequestMethod(
  request: Request,
  env: Env,
  ctx: ExecutionContext
) {
  if (new URL(request.url).pathname !== "/api") {
    return new Response(null, { status: 404 });
  }
  if (request.method == "GET") return await handleGet(request, env, ctx);
  else if (request.method == "POST") return await handlePost(request, env, ctx);
  else throw new Error("Wrong HTTP method");
}

async function handleGet(request: Request, env: Env, ctx: ExecutionContext) {
  const url = new URL(request.url);
  const getRequest = {
    page: Number.parseInt(url.searchParams.get("page")!, 10),
  };
  console.log("Handling GET request:", getRequest);
  checkGetRequest(getRequest);

  const messagesJSON = readRows(
    env,
    getRequest.page * GET_PAGE_SIZE,
    (getRequest.page + 1) * GET_PAGE_SIZE
  );

  let responseJSON = "";
  for await (const messageJSON of messagesJSON) {
    responseJSON += responseJSON.length === 0 ? "[" : ",";
    responseJSON += messageJSON;
  }
  responseJSON += "]";

  return new Response(responseJSON);
}

async function handlePost(request: Request, env: Env, ctx: ExecutionContext) {
  const submitRequest: Partial<SubmitRequest> = getFormData(
    await request.formData()
  );
  console.log("Handling POST request:", submitRequest);
  checkSubmitRequest(submitRequest);

  const spamCheck = checkSpam(submitRequest);
  if (spamCheck.isSpam) {
    console.log("Discarding detected spam. Reason: " + spamCheck.reason);
    return refreshResponse();
  }

  const stampXs = arrayField(submitRequest.stampXs);
  const stampYs = arrayField(submitRequest.stampYs);

  const now = new Date();

  const snapshot = await env.data.get(MASTER_KEY, "stream");
  const writingSnapshot = (async () => {
    if (snapshot) {
      const snapshotName =
        "snapshot-" +
        now.getFullYear() +
        "-" +
        String(now.getUTCMonth() + 1).padStart(2, "0") +
        "-" +
        String(now.getUTCDate()).padStart(2, "0");
      await env.data.put(snapshotName, snapshot);
    }
  })();

  const newMessageJSON = JSON.stringify({
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
        typeIndex: Number(typeIndex),
        x: Number(stampXs[index]),
        y: Number(stampYs[index]),
      })),
  });
  await prependRow(env, newMessageJSON);

  ctx.waitUntil(
    Promise.all([
      writingSnapshot,
      evictSnapshots(env),
      sendNotificationEmail(
        env,
        String(submitRequest.text) +
          "\r\n" +
          (submitRequest.name && String(submitRequest.name))
      ),
    ])
  );

  return refreshResponse();
}

function refreshResponse() {
  return new Response(
    null,
    Response.redirect("https://leanrada.com/guestbook/")
  );
}

async function evictSnapshots(env: Env) {
  const enableSnapshotEviction = env.enable_snapshot_eviction === true;

  const snapshots = await env.data.list({
    prefix: "snapshot-",
    limit: 1000,
  });

  const forEviction: string[] = [];

  let lastDate = null;
  for (const key of snapshots.keys) {
    const [_, yearStr, monthStr, dateStr] = key.name.split("-");
    const date = new Date(
      Number(yearStr),
      Number(monthStr) - 1,
      Number(dateStr)
    );
    if (
      lastDate &&
      shouldEvictSnapshot(date.getTime(), lastDate.getTime(), Date.now())
    ) {
      forEviction.push(key.name);
    } else {
      lastDate = date;
    }
  }

  console.log(
    (enableSnapshotEviction ? "" : "[disabled]") +
      `Snapshot eviction (${forEviction.length})...`,
    snapshots.keys.reduce((obj, key) => {
      obj[key.name] = forEviction.includes(key.name) ? "evict" : "keep";
      return obj;
    }, {} as Record<string, any>)
  );

  if (enableSnapshotEviction) {
    await Promise.all(
      forEviction.map((key) => {
        console.log("Evicting", key);
        return env.data.delete(key);
      })
    );
  }

  return forEviction;
}

async function sendNotificationEmail(env: Env, body: string) {
  const data = {
    from: "notify@leanrada.com",
    to: "notify-xfscgrxn@leanrada.com",
    subject: "New guestbook entry",
    body,
  };

  if (env.enable_notification_email === true) {
    const [{ generateMimeEmail }, { EmailMessage }] = await Promise.all([
      import("./email"),
      import("cloudflare:email"),
    ]);

    const email = generateMimeEmail(data);

    try {
      await env.notify.send(new EmailMessage(data.from, data.to, email));
    } catch (e) {
      console.error("Notification email not sent!", e);
    }
  } else {
    console.log("[disabled] Notification email...", data);
  }
}

async function prependRow(env: Env, newRow: string) {
  const stream = await env.data.get(MASTER_KEY, "stream");
  if (stream) {
    const encoder = new TextEncoder();
    let prepended = false;

    const prependTransform = new TransformStream({
      start(controller) {
        if (!prepended) {
          controller.enqueue(encoder.encode(newRow + "\n"));
          prepended = true;
        }
      },
      transform(chunk, controller) {
        controller.enqueue(chunk);
      },
    });

    await env.data.put(MASTER_KEY, stream.pipeThrough(prependTransform));
  } else {
    await env.data.put(MASTER_KEY, newRow);
  }
}

async function* readRows(
  env: Env,
  startIndex: number,
  endIndex: number
): AsyncGenerator<string> {
  const stream: ReadableStream | null = await env.data.get(
    MASTER_KEY,
    "stream"
  );

  if (!stream) {
    console.log("No existing data");
    return;
  }

  const decoder = new TextDecoder();
  let buffer = "";
  let currentIndex = 0;

  for await (const chunk of stream) {
    buffer += decoder.decode(chunk, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (currentIndex >= startIndex && currentIndex < endIndex) {
        yield line;
      }
      if (++currentIndex >= endIndex) return;
    }
  }

  if (buffer && currentIndex >= startIndex && currentIndex < endIndex) {
    yield buffer;
  }
}

function checkGetRequest(getRequest: any): asserts getRequest is GetRequest {
  if (!Number.isInteger(getRequest.page))
    throw new TypeError("getRequest.page is not an integer");
  if (getRequest.page < 0) throw new TypeError("getRequest.page is negative");
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
    if (!Number.isInteger(parseInt(type, 10)))
      throw new TypeError("stampTypes[] is not an integer");
  for (const x of stampXs)
    if (!Number.isInteger(parseInt(x, 10)))
      throw new TypeError("stampXs[] is not an number");
  for (const y of stampYs)
    if (!Number.isInteger(parseInt(y, 10)))
      throw new TypeError("stampYs[] is not an number");
}

function getFormData(formData: FormData): Record<string, string | string[]> {
  const maxLength = 1000;
  const object: Record<string, string | string[]> = Object.create(null);
  for (const key of formData.keys()) {
    const values = formData.getAll(key);
    if (values.length === 1) {
      object[key] = values[0].slice(0, maxLength);
    } else {
      object[key] = values.map((value) => value.slice(0, maxLength));
    }
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
