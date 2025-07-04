import { expect, test } from "vitest";
import { httpRequest } from "./http-request";

test("completes request to http://example.com", async () => {
  const response = await httpRequest({
    url: "http://example.com",
    method: "GET",
  });

  expect(response.startsWith("HTTP/1.1"));
});

test("completes request to https://example.com", async () => {
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
