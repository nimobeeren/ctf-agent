import events from "node:events";
import tls from "node:tls";

/**
 * Make a HTTP request.
 * 
 * Similar to fetch, except it uses a raw TCP connection under the hood which means it can do things
 * that fetch doesn't allow, like sending a GET request with a body.
 * */
export async function httpRequest(init: {
  url: string | URL;
  method: string;
  headers?: Headers;
  body?: string;
  timeout?: number;
}) {
  const url = new URL(init.url);
  if (url.protocol !== "https:") {
    throw new Error("Only HTTPS is supported");
  }

  const headers = new Headers(init.headers);
  headers.set("Host", url.hostname);
  headers.set("Connection", "close");

  if (init.body) {
    headers.set(
      "Content-Length",
      String(Buffer.byteLength(init.body, "utf-8"))
    );
  }

  let headersString = "";
  for (const [name, value] of headers.entries()) {
    headersString += `${name}: ${value}\r\n`;
  }

  const requestPath = (url.pathname || "/") + url.search;
  const requestMessage = `${init.method.toUpperCase()} ${requestPath} HTTP/1.1\r\n${headersString}\r\n${
    init.body || ""
  }`;

  const socket = tls.connect(Number(url.port) || 443, url.hostname, {
    rejectUnauthorized: false,
    timeout: init.timeout ?? 5000,
  });
  socket.write(requestMessage);
  let responseMessage = "";
  socket.on("data", (data) => {
    responseMessage += data.toString();
  });
  socket.on("timeout", () => {
    socket.destroy(new Error("Request timed out"));
  });
  await events.once(socket, "end");
  return responseMessage;
}
