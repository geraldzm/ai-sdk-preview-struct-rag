import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import z from "zod";

export const createDocumentTitle = async (
  rawContent: string,
): Promise<string> => {
  // Note: This prompt does not come from the paper. There is nothing on the paper that says how to create the document's title
  const systemPrompt = `
You are a concise technical writer.
Return ONLY a short, accurate title (≤ 12 words) that best describes
the provided document. Preserve the original language. Do not add
quotes or any extra text beyond the title itself.
`;

  const prompt = `
Instruction:
Given the following Raw Document, write its TITLE.

Input:
Raw Document:
${rawContent}

Output:
TITLE:
`;

  const { object } = await generateObject({
    model: openai("gpt-4o"),
    system: systemPrompt,
    schema: z.object({
      title: z
        .string()
        .describe(
          "Accurate title that best describes the document's main content.",
        ),
    }),
    prompt,
  });
  console.log("here");

  return object.title;
};
