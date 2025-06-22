import { createAzure } from "@ai-sdk/azure";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { generateText, tool } from "ai";
import "dotenv/config";
import { readFileSync } from "fs";
import { LangfuseExporter } from "langfuse-vercel";
import { exit } from "node:process";
import { parseArgs } from "node:util";
import z from "zod";

const MAX_RESPONSE_BODY_LENGTH = 5000; // characters

// Set up Langfuse tracing
const sdk = new NodeSDK({
  traceExporter: new LangfuseExporter(),
  instrumentations: [getNodeAutoInstrumentations()],
});
sdk.start();

// Read challenge from file passed as CLI argument
const { positionals } = parseArgs({
  allowPositionals: true,
  strict: false,
});
if (positionals.length < 1) {
  console.error(
    "Please provide a path to a text file that contains a CTF challenge"
  );
  exit(1);
}
const challenge = readFileSync(positionals[0], "utf-8");

const azure = createAzure({
  baseURL: `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments`,
  apiKey: process.env.AZURE_OPENAI_API_KEY,
});

const prompt = `
You are an agent that completes Capture-The-Flag (CTF) challenges. Use the tools to find the flag.

Challenge:
${challenge}
`;

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
        const response = await fetch(url, {
          method,
          headers: headers.map(({ name, value }) => [name, value]),
          body: body || undefined,
          // We want to see the raw response, no additional behavior like
          // redirect following. This also allows us to see cookies in
          // the response.
          redirect: "manual",
        });

        // Read the response body text up to a maximum length
        let responseBodyText = "";
        if (response.body) {
          for await (const chunk of response.body.pipeThrough(
            new TextDecoderStream()
          )) {
            if (
              responseBodyText.length + chunk.length >
              MAX_RESPONSE_BODY_LENGTH
            ) {
              responseBodyText += `... (truncated)`;
              break;
            }
            responseBodyText += chunk;
          }
        }

        // Read the response headers and store them as `name: value` strings.
        // We can't store headers as an object since there may be multiple
        // headers with the same name.
        let responseHeadersText = "";
        for (const [name, value] of response.headers.entries()) {
          responseHeadersText += `${name}: ${value}\n`;
        }

        return `\
HTTP/2 ${response.status} ${response.statusText}
${responseHeadersText}

${responseBodyText}
`;
      } catch (e) {
        // Give the error back to the LLM
        return String(e);
      }
    },
  }),
};

const result = await generateText({
  model: azure("o4-mini"),
  prompt,
  tools,
  maxSteps: 20,
  onStepFinish: (step) => {
    for (const toolCall of step.toolCalls) {
      console.log(
        `🛠️ ${toolCall.toolName}: ${JSON.stringify(toolCall.args, null, 2)}`
      );
    }
  },
  experimental_telemetry: { isEnabled: true },
});

console.log("🏁", result.text);
console.log(`🪜 Took ${result.steps.length} steps`);

await sdk.shutdown();
