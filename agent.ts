import { createAzure } from "@ai-sdk/azure";
import type { OpenAIResponsesProviderOptions } from "@ai-sdk/openai";
import { generateText, tool } from "ai";
import crypto from "node:crypto";
import z from "zod";
import { httpRequest } from "./network.ts";

const MAX_RESPONSE_LENGTH = 5000; // characters

/**
 * Agent that completes Capture-The-Flag (CTF) challenges.
 *
 * @param challenge Description of the challenge to complete. It should at least contain a URL as a
 * starting point.
 */
export async function agent(challenge: string) {
  const azure = createAzure({
    baseURL: `${process.env.AZURE_OPENAI_ENDPOINT}/openai/v1`,
    apiKey: process.env.AZURE_OPENAI_API_KEY,
    apiVersion: "preview",
  });

  const prompt = `
You are an agent that completes Capture-The-Flag (CTF) challenges. Use the tools to find the flag. Summarize your steps at the end.

Challenge:
${challenge}
`.trim();

  const tools = {
    request: tool({
      description: "Make a HTTP request",
      parameters: z.object({
        method: z.string(),
        url: z.string(),
        headers: z.array(
          z.object({
            name: z.string(),
            value: z.string(),
          })
        ),
        body: z.string(),
      }),
      execute: async ({ method, url, headers, body }) => {
        console.log("🌐", { method, url, headers, body });
        try {
          let responseMessage = await httpRequest({
            method,
            url,
            headers: new Headers(headers.map((h) => [h.name, h.value])),
            body,
          });

          // Truncate the response if it is too long
          if (responseMessage.length > MAX_RESPONSE_LENGTH) {
            responseMessage =
              responseMessage.slice(0, MAX_RESPONSE_LENGTH) + "... (truncated)";
          }

          return responseMessage;
        } catch (e) {
          // Give the error back to the LLM
          return String(e);
        }
      },
    }),
    sha256: tool({
      description:
        "Compute the SHA-256 hash of a UTF-8 string, returning the digest as a hex string",
      parameters: z.object({
        input: z.string(),
      }),
      execute: async ({ input }) => {
        return crypto.createHash("sha256").update(input).digest("hex");
      },
    }),
  };

  const startTime = Date.now();

  const result = await generateText({
    model: azure.responses("o4-mini"),
    prompt,
    tools,
    maxSteps: 20,
    providerOptions: {
      openai: {
        reasoningEffort: "medium",
        reasoningSummary: "auto",
      } satisfies OpenAIResponsesProviderOptions,
    },
    onStepFinish: (step) => {
      // NOTE: OpenAI doesn't seem to return a reasoning summary when a tool was used
      console.log("🧠", step.reasoning);
    },
    experimental_telemetry: { isEnabled: true },
  });

  console.log("🏁", result.text);
  console.log(`🪜  Took ${result.steps.length} steps`);
  console.log(`⌛ Took ${((Date.now() - startTime) / 1000).toFixed(2)}s`);
}
