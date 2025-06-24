import "dotenv/config";
import { AzureOpenAI } from "openai";
import type {
  ChatCompletionMessageParam,
  ChatCompletionTool,
} from "openai/resources";

const client = new AzureOpenAI();

const messages: ChatCompletionMessageParam[] = [
  {
    role: "user",
    content: `
    You are an agent that completes CTF (Capture-The-Flag) challenges. Use the tools to find the flag.
    
    Challenge:
    See if you can leak the whole database using what you know about SQL Injections. https://web.ctflearn.com/web4/`,
  },
];

const tools: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "request",
      description: "Make a HTTP request",
      strict: true,
      parameters: {
        type: "object",
        properties: {
          url: {
            type: "string",
          },
        },
        required: ["url"],
        additionalProperties: false,
      },
    },
  },
];

const completion = await client.chat.completions.create({
  model: "gpt-4.1",
  messages,
  tools,
});

console.log(JSON.stringify(completion.choices[0].message, null, 2));
messages.push(completion.choices[0].message);

// Get the tool call and its args from chat completion
const toolCall = completion.choices[0].message.tool_calls![0]; // assuming there was a tool call
const args = JSON.parse(toolCall.function.arguments);

// Execute the tool call
const response = await fetch(args.url); // kinda unsafe
const result = await response.text();

// Add the tool call to the messages
messages.push({
  role: "tool",
  tool_call_id: toolCall.id,
  content: result,
});

// Call the model again with the tool call and its result
const completion2 = await client.chat.completions.create({
  model: "gpt-4.1",
  messages,
  tools,
});

// Log the second step
console.log(JSON.stringify(completion2.choices[0].message, null, 2));
