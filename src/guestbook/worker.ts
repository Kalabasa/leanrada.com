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
    const submitRequest: Partial<SubmitRequest> = await request.json();
    console.log("Handling request:", submitRequest);
    checkSubmitRequest(submitRequest);

    let data = await env.data.get("master", { type: "json" });
    if (data) {
      checkData(data, "-master");
    } else {
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

    submitChange(data, env);

    return new Response(null);
  } catch (e) {
    console.error(
      "Returning 404 due to",
      e instanceof Error
        ? e.name + ": " + e.message.slice(0, 70).replaceAll(/\s/g, " ")
        : " unknown error"
    );
    return new Response(null, { status: 404 });
  }
}

function submitChange(data: string[], env: Env) {}

function checkSubmitRequest(
  submitRequest: Partial<SubmitRequest>
): asserts submitRequest is SubmitRequest {
  if (typeof submitRequest.page !== "number")
    throw new TypeError("submitRequest is missing page");
  if (Math.floor(submitRequest.page) !== submitRequest.page)
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
