import { once } from "node:events";
import tls from "node:tls";

export async function httpRequest(init: {
  url: string | URL;
  method: string;
  headers?: Headers;
  body?: string;
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

  // TODO: set timeout
  const socket = tls.connect(Number(url.port) || 443, url.hostname, {
    rejectUnauthorized: false,
  });
  socket.write(requestMessage);
  let responseMessage = "";
  socket.on("data", (data) => {
    responseMessage += data.toString();
  });
  await once(socket, "end");
  return responseMessage;
}
