import { createAzure } from "@ai-sdk/azure";
import { generateText, tool } from "ai";
import "dotenv/config";
import { z } from "zod";

const azure = createAzure({
  baseURL: `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments`,
  apiKey: process.env.AZURE_OPENAI_API_KEY,
});

const prompt = `
You are an agent that completes CTF (Capture-The-Flag) challenges. Use the tools to find the flag.

Challenge:
See if you can leak the whole database using what you know about SQL Injections. https://web.ctflearn.com/web4/`;

const tools = {
  request: tool({
    description: "Make a HTTP request",
    parameters: z.object({
      url: z.string(),
    }),
    execute: async ({ url }) => {
      console.log(url);
      const response = await fetch(url);
      return await response.text();
    },
  }),
};

const result = await generateText({
  model: azure("o4-mini"),
  prompt,
  tools,
});

console.log(result.text);
