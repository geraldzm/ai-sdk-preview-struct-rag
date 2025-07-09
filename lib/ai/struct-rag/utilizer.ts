import { openai } from "@ai-sdk/openai";
import { loadPrompt } from "../prompt-utils";
import { generateText } from "ai";
import { readFileFromTmpDir } from "@/lib/file-utils";

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
  dir: string,
  subqueries: string[],
  chosen: "table" | "graph" | "algorithm" | "catalogue" | "chunk",
  docs: { title: string; content: string }[],
): Promise<string[]> => {
  console.log("extract");

  switch (chosen) {
    case "chunk":
      return extractChunk(subqueries, docs);
    case "table":
      return extractTable(dir, subqueries);
    case "graph":
      return extractGraph(dir, subqueries);
    case "algorithm":
      return extractAlgorithm(dir, subqueries);
    case "catalogue":
      return extractCatalogue(dir, subqueries);
  }
};

const extractChunk = async (
  subqueries: string[],
  docs: { title: string; content: string }[],
): Promise<string[]> => {
  const subknowledges: string[] = [];

  for (const doc of docs) {
    const chunk = `${doc.title}: ${doc.content}`;
    const composedQuery = subqueries.join("\n");
    const prompt = `\n\nQuery:\n${composedQuery}\n\nDocument:\n${chunk}\n\nOutput:`;

    const { text } = await generateText({
      model: openai("gpt-4o"),
      maxTokens: 4096,
      system: "Instruction:\nAnswer the Query based on the given Document.",
      prompt: prompt,
    });

    subknowledges.push(`Retrieval result for ${doc.title}: ${text}`);
  }

  return subknowledges;
};

const extractTable = async (
  dir: string,
  subqueries: string[],
): Promise<string[]> => {
  const tables: string[] = await readFileFromTmpDir(dir, "table.json");
  let tablesContent = "";
  tables.forEach(
    (table, i) => (tablesContent += `Table ${i + 1}:\n${table}\n\n`),
  );

  const subknowledges: string[] = [];
  for (const subquery of subqueries) {
    const { text } = await generateText({
      model: openai("gpt-4o"),
      maxTokens: 4096,
      system:
        "Instruction:\nThe following Tables show multiple independent tables built from multiple documents.\nFilter these tables according to the query, retaining only the table information that helps answer the query.\nNote that you need to analyze the attributes and entities mentioned in the query and filter accordingly.\nThe information needed to answer the query must exist in one or several tables, and you need to check these tables one by one.",
      prompt: `\n\nTables:${tablesContent}\n\nQuery:${subquery}\n\nOutput:`,
    });

    subknowledges.push(text);
  }

  return subknowledges;
};

const extractGraph = async (
  dir: string,
  subqueries: string[],
): Promise<string[]> => {
  const graphs: string[] = await readFileFromTmpDir(dir, "graphs.json");
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
  dir: string,
  subqueries: string[],
): Promise<string[]> => {
  const algorithms: string[] = await readFileFromTmpDir(dir, "algorithms.json");
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
  dir: string,
  subqueries: string[],
): Promise<string[]> => {
  const catalogues: string[] = await readFileFromTmpDir(dir, "catalogues.json");
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
