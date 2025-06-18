import { createAzure } from "@ai-sdk/azure";
import { generateText, tool } from "ai";
import "dotenv/config";
import tls from "tls";
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
      host: z
        .string()
        .describe("The host to send the request to (without port)"),
      rawRequest: z
        .string()
        .describe("The raw request to send in HTTP/1.1 RFC 9112 format"),
    }),
    execute: async ({ host, rawRequest }) => {
      return new Promise((resolve, reject) => {
        const client = tls.connect(
          443,
          host,
          { rejectUnauthorized: false },
          () => {
            client.write(rawRequest.replace(/\n/g, "\r\n"));
          }
        );

        let response = "";
        client.on("data", (data) => {
          response += data.toString();
        });

        client.on("end", () => {
          resolve(response);
        });

        client.on("error", (err) => {
          reject(err);
        });
      });
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
});

console.log("✨ tool results:", result.toolResults);
console.log("🛠️ tool calls without results:", result.toolCalls);
console.log("🏁 final output:", result.text);
