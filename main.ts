import { createAzure } from "@ai-sdk/azure";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { generateText, tool } from "ai";
import "dotenv/config";
import { LangfuseExporter } from "langfuse-vercel";
import z from "zod";

// Set up Langfuse tracing
const sdk = new NodeSDK({
  traceExporter: new LangfuseExporter(),
  instrumentations: [getNodeAutoInstrumentations()],
});
sdk.start();

const challenge = `
ENTER A CHALLENGE HERE
`;

const azure = createAzure({
  baseURL: `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments`,
  apiKey: process.env.AZURE_OPENAI_API_KEY,
});

const tools = {
  get: tool({
    description: "Make a HTTP GET request",
    parameters: z.object({
      url: z.string(),
      headers: z.array(
        z.object({
          name: z.string(),
          value: z.string(),
        })
      ),
    }),
    execute: async ({ url, headers }) => {
      const response = await fetch(url, {
        method: "GET",
        headers: headers.map(({ name, value }) => [name, value]),
      });
      return {
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        body: await response.text(),
      };
    },
  }),
  post: tool({
    description: "Make a HTTP POST request",
    parameters: z.object({
      url: z.string(),
      headers: z.array(
        z.object({
          name: z.string(),
          value: z.string(),
        })
      ),
      body: z.string(),
    }),
    execute: async ({ url, headers, body }) => {
      const response = await fetch(url, {
        method: "POST",
        headers: headers.map(({ name, value }) => [name, value]),
        body,
      });
      return {
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        body: await response.text(),
      };
    },
  }),
};

const prompt = `
You are an agent that completes Capture-The-Flag (CTF) challenges. Use the tools to find the flag.

Challenge:
${challenge}
`;

const result = await generateText({
  model: azure("o3"),
  tools,
  prompt,
  maxSteps: 10,
  experimental_telemetry: { isEnabled: true },
});

console.log("✨ tool results:", result.toolResults);
console.log("🛠️ tool calls without results:", result.toolCalls);
console.log("🏁 final output:", result.text);

await sdk.shutdown();
