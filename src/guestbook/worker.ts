/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export interface Env {
  // Example binding to KV. Learn more at https://developers.cloudflare.com/workers/runtime-apis/kv/
  // MY_KV_NAMESPACE: KVNamespace;
  //
  // Example binding to Durable Object. Learn more at https://developers.cloudflare.com/workers/runtime-apis/durable-objects/
  // MY_DURABLE_OBJECT: DurableObjectNamespace;
  //
  // Example binding to R2. Learn more at https://developers.cloudflare.com/workers/runtime-apis/r2/
  // MY_BUCKET: R2Bucket;
  //
  // Example binding to a Service. Learn more at https://developers.cloudflare.com/workers/runtime-apis/service-bindings/
  // MY_SERVICE: Fetcher;
  //
  // Example binding to a Queue. Learn more at https://developers.cloudflare.com/queues/javascript-apis/
  // MY_QUEUE: Queue;
}

// Must be constant forever
const PAGE_WIDTH = 20;
const PAGE_HEIGHT = 10;

type Page = {
  content: string;
  edits: Edit[];
};

type Edit = {
  user: string;
  inserts: Insert[];
};

type Insert = {
  page: number;
  offset: number;
  text: string;
};

async function fetch(
  request: Request,
  env: Env,
  ctx: ExecutionContext
): Promise<Response> {
  try {
    const url = new URL(request.url);

    let pageIndices;
    pageIndices = parsePageIndices(url);
    if (pageIndices.length > 2) pageIndices.length = 2;

    const pageContents = await Promise.all(
      pageIndices.map((i) => getPageContent(i))
    );

    return new Response(JSON.stringify(pageContents), {
      headers: {
        "content-type": "application/json;charset=UTF-8",
      },
    });
  } catch (e) {
    console.error(e);
    return new Response(null, { status: 404 });
  }
}

function parsePageIndices(url: URL): number[] {
  const strPages = url.searchParams.getAll("page");
  const numPages = strPages.map((s) => Number.parseInt(s, 10));

  if (numPages.some((p) => Number.isNaN(p))) {
    throw new TypeError("NaN page parameter");
  }

  return numPages;
}

async function getPageContent(index: number): Promise<string> {
  return `12345678901234567890
12345678901234567890
12345678901234567890
12345678901234567890
12345678901234567890
12345678901234567890
12345678901234567890
12345678901234567890
12345678901234567890
12345678901234567890`;
}

export default { fetch };
