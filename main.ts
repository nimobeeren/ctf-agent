import { createAzure } from "@ai-sdk/azure";
import { generateText, tool } from "ai";
import "dotenv/config";
import z from "zod";

const challenge = `
Flat Forge Society
200
Developed by The S-Unit

Ah, greetings, stranger! I'm a wee bit sloshed tonight, so bear wit' me, will ye? Listen up, the dwarven database holds secrets 'bout the earth… an' it ain't round like them elf folk claim. Nay, it's flat as a forge table! I'm afraid if we keep diggin' too deep, we might just blast a hole right through it! That'd be the end o' us all! So I needs ye to hack inta the Stoneforge Archives, find them secrets, an' stop this madness.

https://mines.ctf.p0wnparty.nl/
`;

const azure = createAzure({
  baseURL: `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments`,
  apiKey: process.env.AZURE_OPENAI_API_KEY,
});

const tools = {
  request: tool({
    description: "Make a HTTP request",
    parameters: z.object({
      url: z.string().describe("The URL to request"),
      // method: z.string().describe("The HTTP method to use"),
      // headers: z.record(z.string(), z.string()).describe("The HTTP headers to send"),
      // body: z.string().describe("The HTTP body to send"),
    }),
    execute: async ({ url }) => {
      const response = await fetch(url);
      return {
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
  model: azure("gpt-4.1"),
  tools,
  prompt,
  // maxSteps: 3,
});

console.log("🛠️ tool results:", result.toolResults);
console.log("🏁 final output:", result.text);
