import z from "zod";
import { loadPrompt } from "../prompt-utils";
import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";

export const selectStructure = async (
  titles: string,
  query: string,
): Promise<"table" | "graph" | "algorithm" | "catalogue" | "chunk"> => {
  const prompt = await loadPrompt("route");

  const { object } = await generateObject({
    model: openai("gpt-4o"),
    system: prompt,
    schema: z.object({
      structure: z
        .enum(["table", "graph", "algorithm", "catalogue", "chunk"])
        .describe("selected structure"),
    }),
    prompt:
      "Doc Info:\n" +
      `${titles}\n\n` +
      "Query:\n" +
      `${query}\n\n` +
      "Output:\n",
  });

  return object.structure;
};
