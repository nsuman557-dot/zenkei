import { createServer } from "node:http";
import { Readable } from "node:stream";
import { handle } from "./handler.js";

const BODY_LIMIT = 1024 * 1024;
const REQUEST_DROP_HEADERS = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
  "host",
  "content-length",
]);
const RESPONSE_HOP_BY_HOP = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
]);
const runtimeEnv = { ...process.env, IS_DEV: false };

function requestHeaders(incoming) {
  const headers = new Headers();
  for (let i = 0; i < incoming.rawHeaders.length; i += 2) {
    const name = incoming.rawHeaders[i].toLowerCase();
    if (!REQUEST_DROP_HEADERS.has(name)) headers.append(name, incoming.rawHeaders[i + 1]);
  }
  return headers;
}

async function requestBody(incoming) {
  const chunks = [];
  let size = 0;
  for await (const chunk of incoming) {
    size += chunk.length;
    if (size > BODY_LIMIT) {
      const error = new Error("Request body too large");
      error.statusCode = 413;
      throw error;
    }
    chunks.push(chunk);
  }
  return chunks.length ? Buffer.concat(chunks) : undefined;
}

function sendJson(response, status, body) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  response.end(JSON.stringify(body));
}

const server = createServer(async (incoming, outgoing) => {
  try {
    const method = incoming.method || "GET";
    const parsed = new URL(incoming.url || "/", "http://127.0.0.1");
    const url = new URL(`${parsed.pathname}${parsed.search}`, "http://127.0.0.1");

    if (url.pathname === "/healthz" && (method === "GET" || method === "HEAD")) {
      outgoing.writeHead(200, {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      });
      outgoing.end(method === "HEAD" ? undefined : "ok");
      return;
    }

    if (!(url.pathname.startsWith("/api/") || url.pathname === "/proxy")) {
      sendJson(outgoing, 404, { error: "Not found" });
      return;
    }

    const headers = requestHeaders(incoming);
    const body = method === "GET" || method === "HEAD" ? undefined : await requestBody(incoming);
    const request = new Request(url, {
      method,
      headers,
      ...(body ? { body } : {}),
    });
    const result = await handle(request, runtimeEnv);

    if (!result) {
      sendJson(outgoing, 404, { error: "Not found" });
      return;
    }

    const responseHeaders = {};
    result.headers.forEach((value, name) => {
      if (!RESPONSE_HOP_BY_HOP.has(name.toLowerCase())) responseHeaders[name] = value;
    });
    outgoing.writeHead(result.status, responseHeaders);

    if (method === "HEAD" || !result.body) {
      if (method === "HEAD") await result.body?.cancel().catch(() => {});
      outgoing.end();
      return;
    }

    const stream = Readable.fromWeb(result.body);
    outgoing.on("close", () => {
      if (!outgoing.writableEnded) stream.destroy();
    });
    stream.on("error", (error) => {
      console.error("API response stream failed:", error?.name || "Error");
      if (!outgoing.headersSent) sendJson(outgoing, 502, { error: "Upstream response failed" });
      else outgoing.destroy(error);
    });
    stream.pipe(outgoing);
  } catch (error) {
    console.error("API request failed:", error?.name || "Error");
    if (outgoing.headersSent) {
      outgoing.destroy(error);
      return;
    }
    const status = error?.statusCode === 413 ? 413 : 500;
    sendJson(outgoing, status, {
      error: status === 413 ? "Request body too large" : "Internal server error",
    });
  }
});

const port = Number.parseInt(process.env.PORT || "3000", 10) || 3000;
server.listen(port, "0.0.0.0", () => {
  console.log(`Zenkai API listening on 0.0.0.0:${port}`);
});
