import { openai } from "@ai-sdk/openai";
import { loadPrompt } from "../prompt-utils";
import { generateText } from "ai";

export const decompose = async (
  query: string,
  kbInfo: string,
): Promise<string[]> => {
  console.log("decompose");

  const systemPrompt = await loadPrompt("decompose");
  const { text } = await generateText({
    model: openai("gpt-4o"),
    maxTokens: 4096,
    system: systemPrompt,
    prompt:
      "Doc Info:\n" + `${kbInfo}\n\n` + "Query:\n" + `${query}\n\n` + "Output:",
  });

  const subqueries = text.split("\n");
  return subqueries;
};

export const extract = async (
  subqueries: string[],
  chosen: "table" | "graph" | "algorithm" | "catalogue" | "chunk",
  kbInfo: string[],
): Promise<string[]> => {
  console.log("extract");

  switch (chosen) {
    case "chunk":
      return extractChunk(subqueries, kbInfo);
    case "table":
      return extractTable(subqueries, kbInfo);
    case "graph":
      return extractGraph(subqueries, kbInfo);
    case "algorithm":
      return extractAlgorithm(subqueries, kbInfo);
    case "catalogue":
      return extractCatalogue(subqueries, kbInfo);
  }
};

const extractChunk = async (
  subqueries: string[],
  chunks: string[],
): Promise<string[]> => {
  const subknowledges: string[] = [];

  for (const chunk of chunks) {
    const composedQuery = subqueries.join("\n");
    const prompt = `\n\nQuery:\n${composedQuery}\n\nDocument:\n${chunk}\n\nOutput:`;

    const { text } = await generateText({
      model: openai("gpt-4o"),
      maxTokens: 4096,
      system: "Instruction:\nAnswer the Query based on the given Document.",
      prompt: prompt,
    });

    // TODO: This split is not reliable since the title itself can contain a ":"
    const title = chunk.split(":")[0];
    subknowledges.push(`Retrieval result for ${title}: ${text}`);
  }

  return subknowledges;
};

const extractTable = async (
  subqueries: string[],
  tables: string[],
): Promise<string[]> => {
  let tablesContent = "";
  tables.forEach(
    (table, i) => (tablesContent += `Table ${i + 1}:\n${table}\n\n`),
  );

  const subknowledges: string[] = [];
  for (const subquery of subqueries) {
    const { text } = await generateText({
      model: openai("gpt-4o"),
      maxTokens: 4096,
      system: "",
      prompt: `\n\nTables:${tablesContent}\n\nQuery:${subquery}\n\nOutput:`,
    });

    subknowledges.push(text);
  }

  return subknowledges;
};

const extractGraph = async (
  subqueries: string[],
  graphs: string[],
): Promise<string[]> => {
  const graphsContent = graphs.join("\n\n");

  const subknowledges: string[] = [];
  for (const subquery of subqueries) {
    const { text } = await generateText({
      model: openai("gpt-4o"),
      maxTokens: 4096,
      system:
        "Instruction: According to the query, filter out the triples from all triples in the graph that can help answer the query.\nNote, carefully analyze the entities and relationships mentioned in the query and filter based on this information.",
      prompt: `Graphs:${graphsContent}\n\nQuery:${subquery}\n\nOutput:`,
    });

    subknowledges.push(text);
  }

  return subknowledges;
};

const extractAlgorithm = async (
  subqueries: string[],
  algorithms: string[],
): Promise<string[]> => {
  const algorithmsContent = algorithms.join("\n\n");

  const subknowledges: string[] = [];
  for (const subquery of subqueries) {
    const { text } = await generateText({
      model: openai("gpt-4o"),
      maxTokens: 4096,
      system:
        "Instruction: According to the query, filter out information from algorithm descriptions that can help answer the query.\nNote, carefully analyze the entities and relationships mentioned in the query and filter based on this information.",
      prompt: `Algorithms:${algorithmsContent}\n\nQuery:${subquery}\n\nOutput:`,
    });

    subknowledges.push(text);
  }

  return subknowledges;
};

const extractCatalogue = async (
  subqueries: string[],
  catalogues: string[],
): Promise<string[]> => {
  const cataloguesContent = catalogues.join("\n\n");

  const subknowledges: string[] = [];
  for (const subquery of subqueries) {
    const { text } = await generateText({
      model: openai("gpt-4o"),
      maxTokens: 4096,
      system:
        "Instruction: According to the query, filter out information from the catalogue that can help answer the query.\nNote, carefully analyze the entities and relationships mentioned in the query and filter based on this information.",
      prompt: `Catalogues:${cataloguesContent}\n\nQuery:${subquery}\n\nOutput:`,
    });

    subknowledges.push(text);
  }

  return subknowledges;
};

export const merge = async (
  query: string,
  subqueries: string[],
  subknowledges: string[],
  chosen: "table" | "graph" | "algorithm" | "catalogue" | "chunk",
): Promise<string> => {
  const pairs = Math.min(subqueries.length, subknowledges.length);

  let retrieval = "";
  switch (chosen) {
    case "chunk":
    case "catalogue":
      retrieval += `Subquery: ${query}\nRetrieval results:\n${subknowledges.join("\n")}\n\n`;
      break;
    case "table":
    case "graph":
    case "algorithm":
      for (let i = 0; i < pairs; i++) {
        retrieval += `Subquery: ${subqueries[i]}\nRetrieval results:\n${subknowledges[i]}\n\n`;
      }
      break;
  }

  const { text: answer } = await generateText({
    model: openai("gpt-4o"),
    maxTokens: 4096,
    system:
      "1. Answer the Question based on retrieval results. \n2. Find the relevant information from given retrieval results and output as detailed, specific, and lengthy as possible. \n3. The output must be a coherent and smooth piece of text.",
    prompt: `Question:\n${query}\n\nRetrieval:\n${retrieval}`,
  });

  return answer;
};
