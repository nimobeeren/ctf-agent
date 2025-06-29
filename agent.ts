import { createAzure } from "@ai-sdk/azure";
import {
  experimental_createMCPClient as createMCPClient,
  generateText,
  tool,
} from "ai";
import { Experimental_StdioMCPTransport as StdioMCPTransport } from "ai/mcp-stdio";
import "dotenv/config";
import z from "zod";
import { httpRequest } from "./http-request.ts";

const MAX_RESPONSE_LENGTH = 5000; // characters

/**
 * Agent that completes Capture-The-Flag (CTF) challenges.
 *
 * @param challenge Description of the challenge to complete.
 */
export async function agent(challenge: string) {
  const azure = createAzure({
    baseURL: `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments`,
    apiKey: process.env.AZURE_OPENAI_API_KEY,
  });

  const prompt = `
You are an agent that completes Capture-The-Flag (CTF) challenges. Use the tools to find the flag. Summarize your steps at the end.

Challenge:
${challenge}
`.trim();

  // MCP Run Python: https://ai.pydantic.dev/mcp/run-python/
  const runPythonMCP = await createMCPClient({
    transport: new StdioMCPTransport({
      command: "deno",
      args: [
        "run",
        "-N",
        "-R=node_modules",
        "-W=node_modules",
        "--node-modules-dir=auto",
        "jsr:@pydantic/mcp-run-python",
        "stdio",
      ],
    }),
  });

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
    ...(await runPythonMCP.tools()),
  };

  const startTime = Date.now();

  const result = await generateText({
    model: azure("o4-mini"),
    prompt,
    tools,
    maxSteps: 20,
    experimental_telemetry: { isEnabled: true },
  });

  console.log("🏁", result.text);
  console.log(`🪜  Took ${result.steps.length} steps`);
  console.log(`⌛ Took ${((Date.now() - startTime) / 1000).toFixed(2)}s`);
}
