import { expect, test } from "vitest";
import { httpRequest } from "./network";

test("completes request to example.com", async () => {
  const response = await httpRequest({
    url: "https://example.com",
    method: "GET",
    headers: new Headers(),
    body: "",
  });

  console.log(response)

  expect(response.startsWith("HTTP/1.1"));
});
