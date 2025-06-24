import "dotenv/config";
import { AzureOpenAI } from "openai";

const client = new AzureOpenAI();

const completion = await client.chat.completions.create({
  model: "gpt-4.1",
  messages: [{ role: "user", content: "Hello world!" }],
});

console.log(completion.choices[0].message.content);
