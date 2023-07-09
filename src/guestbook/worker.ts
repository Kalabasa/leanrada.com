export interface Env {
  GITHUB_SECRET: string;
}

// Must be constant forever
const PAGE_WIDTH = 40;
const PAGE_HEIGHT = 30;

const sourceDataURL =
  "https://raw.githubusercontent.com/Kalabasa/kalabasa.github.io/src/src/site/guestbook/data.json";

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
    checkSubmitRequest(submitRequest);
    console.log(submitRequest);

    const sourceData = await fetch(sourceDataURL);
    console.log(sourceData);

    return new Response(null);
  } catch (e) {
    console.error(
      "Returning 404 due to",
      e instanceof Error ? e.name : " unknown error"
    );
    return new Response(null, { status: 404 });
  }
}

function checkSubmitRequest(
  submitRequest: Partial<SubmitRequest>
): asserts submitRequest is SubmitRequest {
  if (typeof submitRequest.page !== "number")
    throw new TypeError("submitRequest is missing page");
  if (Math.floor(submitRequest.page) !== submitRequest.page)
    throw new TypeError("submitRequest.page is not an integer");
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

export default { fetch: handleRequest };
