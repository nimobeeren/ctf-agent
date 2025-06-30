import events from "node:events";
import net from "node:net";
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
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Only HTTP and HTTPS are supported");
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

  // Use appropriate connection based on protocol
  const isHttps = url.protocol === "https:";
  const defaultPort = isHttps ? 443 : 80;
  const port = Number(url.port) || defaultPort;

  const socket = isHttps
    ? tls.connect(port, url.hostname, {
        rejectUnauthorized: false,
      })
    : net.connect(port, url.hostname);

  socket.setTimeout(init.timeout ?? 5000);
  socket.on("timeout", () => {
    socket.destroy(new Error("Request timed out"));
  });

  socket.write(requestMessage);

  let responseMessage = "";
  socket.on("data", (data) => {
    responseMessage += data.toString();
  });
  await events.once(socket, "end");
  return responseMessage;
}
