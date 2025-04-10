import { Buffer } from "node:buffer";

export interface Env {
  data: KVNamespace;
  client_id: unknown;
  client_secret: unknown;
  refresh_token: unknown;
}

const ONE_DAY_IN_MS = 24 * 60 * 60_000;

const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const DATA_KEY = "data";
const DATA_UPDATE_INTERVAL_MS = ONE_DAY_IN_MS;
const SPAN_TTL_MS = 7 * ONE_DAY_IN_MS;
const TARGET_IMAGE_SIZE = 150;

// The now-playing service doesn’t actually give accurate time information for privacy purposes
// Instead, it returns a *typical* now-playing data sampled from real historical data with a random timezone offset
type StoredData = {
  lastFetchTime: number; // ms since epoch
  samplingTimeOffset: number; // ms
  trackSpans: Array<{
    startAbsTime: number; // ms since epoch
    startRelTime: number; // ms since midnight
    endRelTime: number; // ms since midnight
    name: string;
    imageURL: string | undefined;
    href: string;
  }>;
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
  if (new URL(request.url).pathname !== "/api")
    return new Response(null, { status: 404 });
  if (request.method !== "GET") throw new Error("Wrong HTTP method");
  console.log("Handling GET request");
  const data = await getData(env);
  return new Response(JSON.stringify(data));
}

async function getData(env: Env): Promise<{
  name: string | undefined;
  imageURL: string | undefined;
  href: string | undefined;
  isPlayingNow: boolean;
}> {
  let data: StoredData | null = await env.data.get(DATA_KEY, "json");

  if (!data) {
    data = {
      lastFetchTime: 0,
      samplingTimeOffset: 0,
      trackSpans: [],
    };
  }

  if (data.lastFetchTime + DATA_UPDATE_INTERVAL_MS < Date.now()) {
    console.log("Updating data...");
    const accessToken = await getAccessToken(env);
    const spans = await fetchRecentlyPlayedSpans(accessToken);
    data.lastFetchTime = Date.now();
    data.samplingTimeOffset = Math.floor(Math.random() * ONE_DAY_IN_MS);
    data.trackSpans = [
      // expire old spans
      ...data.trackSpans.filter((span) => span.startAbsTime + SPAN_TTL_MS),
      // add new spans without duplicates
      ...spans.filter(
        (span) =>
          !data.trackSpans.some(
            (existingSpan) =>
              existingSpan.href === span.href &&
              existingSpan.startAbsTime === span.startAbsTime
          )
      ),
    ];
    console.log(data.trackSpans.length + " total track spans:", data.trackSpans);
    await env.data.put(DATA_KEY, JSON.stringify(data));
  }

  const sample = sampleSpan(
    data.trackSpans,
    Date.now() + data.samplingTimeOffset
  );
  console.log(
    `Sampled from ${data.trackSpans.length}` +
      ` with ${formatTimeOffset(data.samplingTimeOffset)} offset:`,
    sample
  );

  return {
    name: sample.span?.name,
    imageURL: sample.span?.imageURL,
    href: sample.span?.href,
    isPlayingNow: sample.current,
  };
}

export function formatTimeOffset(timeOffsetMs: number) {
  const hours = Math.floor(timeOffsetMs / (60 * 60_000));
  const minutes = Math.floor(timeOffsetMs / 60_000 - hours * 60);
  return `+${hours}h:${minutes.toString().padStart(2, "0")}m`;
}

export function sampleSpan<T>(
  spans: Array<T & { startRelTime: number; endRelTime: number }>,
  time: number
): { span: T | null; current: boolean } {
  const relTime = time - new Date(time).setUTCHours(0, 0, 0, 0);

  let lastSpan: T | null = null;
  let lastSpanElapsed = Infinity;

  const remainingIndices = Array.from(spans, (_, i) => i);
  while (remainingIndices.length > 0) {
    const indexIndex = Math.floor(Math.random() * remainingIndices.length);
    const index = remainingIndices[indexIndex];
    remainingIndices.splice(indexIndex, 1);

    const span = spans[index];
    if (span.startRelTime <= relTime && relTime <= span.endRelTime) {
      return { span, current: true };
    }

    const elapsed =
      (ONE_DAY_IN_MS + relTime - span.startRelTime) % ONE_DAY_IN_MS;
    if (elapsed < lastSpanElapsed) {
      lastSpan = span;
      lastSpanElapsed = elapsed;
    }
  }

  return { span: lastSpan, current: false };
}

/* ----------------------------------------------------------------------------- *
 *
 *      Spotify data
 *
/* ----------------------------------------------------------------------------- */

async function fetchRecentlyPlayedSpans(accessToken: string): Promise<
  Array<{
    name: string;
    imageURL: string | undefined;
    href: string;
    startAbsTime: number; // ms since epoch
    startRelTime: number; // ms since midnight
    endRelTime: number; // ms since midnight
  }>
> {
  const data = await fetchRecentlyPlayed(accessToken);
  return data.items.map((item) => {
    const playedAt = new Date(item.played_at);
    const playedAtTime = playedAt.getTime();
    const midnightTime = new Date(playedAt).setUTCHours(0, 0, 0, 0);
    return {
      name: item.track.name,
      imageURL: item.track.album.images.sort(
        (a, b) =>
          Math.abs((a.width ?? 0) - TARGET_IMAGE_SIZE) -
          Math.abs((b.width ?? 0) - TARGET_IMAGE_SIZE)
      )[0]?.url,
      href: item.track.external_urls.spotify,
      startAbsTime: playedAtTime,
      startRelTime: playedAtTime - midnightTime,
      endRelTime: playedAtTime - midnightTime + item.track.duration_ms,
    };
  });
}

async function fetchRecentlyPlayed(accessToken: string): Promise<{
  items: Array<{
    played_at: string;
    track: {
      name: string;
      duration_ms: number;
      external_urls: {
        spotify: string;
      };
      album: {
        images: Array<{
          url: string;
          height?: number;
          width?: number;
        }>;
      };
    };
  }>;
}> {
  console.log("Fetching recently played...");
  const response = await fetch(
    "https://api.spotify.com/v1/me/player/recently-played?limit=50",
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  if (!response.ok)
    throw new Error("fetchRecentlyPlayed error " + response.status);
  return response.json();
}

/* ----------------------------------------------------------------------------- *
 *
 *      Auth
 *
/* ----------------------------------------------------------------------------- */

async function getAccessToken(env: Env): Promise<string> {
  let accessToken: string | null = await env.data.get(ACCESS_TOKEN_KEY, "text");
  if (!accessToken) accessToken = (await updateTokens(env)).accessToken;
  return accessToken;
}

async function updateTokens(env: Env) {
  console.log("Updating tokens...");

  if (typeof env.client_id !== "string")
    throw new Error("invalid env.client_id");
  if (typeof env.client_secret !== "string")
    throw new Error("invalid env.client_secret");
  if (typeof env.refresh_token !== "string")
    throw new Error("invalid env.refresh_token");

  const storedRefreshToken = await env.data.get(REFRESH_TOKEN_KEY, "text");
  if (storedRefreshToken) {
    console.log("Using stored refresh_token...");
  }

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "post",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization:
        "Basic " +
        Buffer.from(env.client_id + ":" + env.client_secret).toString("base64"),
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: storedRefreshToken ?? env.refresh_token,
      client_id: env.client_id,
    }),
  });

  if (!response.ok) {
    console.error(await response.json());
    throw new Error(updateTokens.name + ": fetch error " + response.status);
  }

  const responseJson = (await response.json()) as any;

  if (responseJson.refresh_token) {
    await env.data.put(REFRESH_TOKEN_KEY, String(responseJson.refresh_token));
  }

  const accessToken = String(responseJson.access_token);
  const epsilon = 3;
  const expiration = // in secondsSinceEpoch
    Math.floor(Date.now() / 1000) + Number(responseJson.expires_in) - epsilon;

  await env.data.put(ACCESS_TOKEN_KEY, accessToken, {
    expiration,
  });

  console.log("Tokens updated!");
  return { accessToken };
}

export default { fetch: handleRequest };
