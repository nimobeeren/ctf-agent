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
## Goal
You are an agent that completes Capture-The-Flag (CTF) challenges. The goal is to find the flag which looks like CTF{0123456789abcdef0123456789abcdef}.

## Environment
You are given a challenge which includes a URL of a web application. From here, you can interact freely with the web application.

## Strategy
Look for common vulnerabilities in the web application by interacting with it. Start with simple exploits and try more complex ones as needed. The challenge is designed to be solveable by humans, so there is no need to guess blindly.

## Tools
Prefer using the request tool instead of running code for HTTP requests. When you do run code, keep it short and focused.

## Output Format
When you find the flag, print it and give a short summary of the steps you took to find it. If you believe you have exhausted all possibilities, just say you give up. Never print a flag that you made up.

<challenge>
${challenge}
</challenge>
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
    ...(await runPython.tools()),
  };

  const startTime = Date.now();

  const result = await generateText({
    model: azure("gpt-5-mini"),
    prompt,
    tools,
    temperature: 1,
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
