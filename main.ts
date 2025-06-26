import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { NodeSDK } from "@opentelemetry/sdk-node";
import "dotenv/config";
import { LangfuseExporter } from "langfuse-vercel";
import { readFileSync } from "node:fs";
import { exit } from "node:process";
import { parseArgs } from "node:util";
import { agent } from "./agent.ts";

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

await agent(challenge);

await sdk.shutdown();
