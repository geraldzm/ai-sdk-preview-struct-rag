import { embed, embedMany, generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { cosineDistance, desc, gt, sql } from "drizzle-orm";
import { embeddings } from "../db/schema/embeddings";
import { db } from "../db";
import z from "zod";

const embeddingModel = openai.embedding("text-embedding-ada-002");

const generateChunks = (input: string): string[] => {
  return input
    .trim()
    .split(".")
    .filter((i) => i !== "");
};

export const generateEmbeddings = async (
  value: string,
): Promise<Array<{ embedding: number[]; content: string }>> => {
  const chunks = generateChunks(value);
  const { embeddings } = await embedMany({
    model: embeddingModel,
    values: chunks,
  });
  return embeddings.map((e, i) => ({ content: chunks[i], embedding: e }));
};

export const generateEmbedding = async (value: string): Promise<number[]> => {
  const input = value.replaceAll("\n", " ");
  const { embedding } = await embed({
    model: embeddingModel,
    value: input,
  });
  return embedding;
};

export const findRelevantContent = async (userQuery: string) => {
  const userQueryEmbedded = await generateEmbedding(userQuery);
  const similarity = sql<number>`1 - (${cosineDistance(embeddings.embedding, userQueryEmbedded)})`;
  const similarGuides = await db
    .select({ name: embeddings.content, similarity })
    .from(embeddings)
    .where(gt(similarity, 0.3))
    .orderBy((t) => desc(t.similarity))
    .limit(4);
  return similarGuides;
};

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
