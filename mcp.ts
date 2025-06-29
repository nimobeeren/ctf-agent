import { experimental_createMCPClient as createMCPClient } from "ai";
import { Experimental_StdioMCPTransport as StdioMCPTransport } from "ai/mcp-stdio";

/**
 * MCP client to run Python code.
 * @see https://ai.pydantic.dev/mcp/run-python/
 */
export const runPython = await createMCPClient({
  transport: new StdioMCPTransport({
    command: "deno",
    args: [
      "run",
      "-N",
      "-R=node_modules",
      "-W=node_modules",
      "--node-modules-dir=auto",
      "jsr:@pydantic/mcp-run-python",
      "stdio",
    ],
  }),
});
