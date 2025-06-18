import { createAzure } from "@ai-sdk/azure";
import { generateText } from "ai";
import "dotenv/config";

const azure = createAzure({
  baseURL: `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments`,
  apiKey: process.env.AZURE_OPENAI_API_KEY,
});

const result = await generateText({
  model: azure("o3"),
  prompt: "Write a one-sentence bedtime story about a unicorn.",
});

console.log(result.response.body);
