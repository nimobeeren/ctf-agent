import { expect, test } from "vitest";
import { httpRequest } from "./network";

test("completes request to example.com", async () => {
  const response = await httpRequest({
    url: "https://example.com",
    method: "GET",
  });

  expect(response.startsWith("HTTP/1.1"));
});

test("rejects on timeout", async () => {
  const response = httpRequest({
    url: "https://example.com",
    method: "GET",
    timeout: 1,
  });

  await expect(response).rejects.toThrow("Request timed out");
});
