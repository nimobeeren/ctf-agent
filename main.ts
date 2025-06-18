import "dotenv/config";
import { AzureOpenAI } from "openai";

// Example: OpenAI Chat Completions API

const client = new AzureOpenAI();

const completion = await client.chat.completions.create({
  model: "gpt-4.1",
  messages: [
    {
      role: "user",
      content: "Write a one-sentence bedtime story about a unicorn.",
    },
  ],
});

console.log(completion.choices[0].message.content);
