import { createAzure } from "@ai-sdk/azure";
import { generateText, tool } from "ai";
import "dotenv/config";
import z from "zod";
import { httpRequest } from "./http-request.ts";
import { runPython } from "./mcp.ts";

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
    // Disabled Python tool for now since it makes the agent overthink things sometimes
    // ...(await runPython.tools()),
  };

  const startTime = Date.now();

  const result = await generateText({
    model: azure("o4-mini"),
    prompt,
    tools,
    maxSteps: 20,
    onStepFinish: (step) => {
      for (const toolCall of step.toolCalls) {
        let icon: string;
        if (toolCall.toolName === "request") {
          icon = "🌐";
        } else if (toolCall.toolName === "run_python_code") {
          icon = "🐍";
        } else {
          icon = "🛠️ ";
        }

        console.log(icon, toolCall.args);
      }
    },
    experimental_telemetry: { isEnabled: true },
  });

  console.log("🏁", result.text);
  console.log(`🪜  Took ${result.steps.length} steps`);
  console.log(`⌛ Took ${((Date.now() - startTime) / 1000).toFixed(2)}s`);
}
