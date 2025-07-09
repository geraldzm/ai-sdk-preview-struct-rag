import { generateText } from "ai";
import { loadPrompt } from "../prompt-utils";
import { openai } from "@ai-sdk/openai";
import { writeFileToTmpDir } from "@/lib/file-utils";

export const construct = async (
  dir: string,
  query: string,
  chosen: "table" | "graph" | "algorithm" | "catalogue" | "chunk",
  docs: { title: string; content: string }[],
): Promise<string> => {
  switch (chosen) {
    case "graph": {
      const instruction =
        "Based on the given document, construct a graph where entities are the titles of papers and the relation is 'reference', using the given document title as the head and other paper titles as tails.";
      const info = await constructGraph(dir, instruction, docs);
      return info;
    }
    case "table": {
      const instruction = `Query is ${query}, please extract relevant complete tables from the document based on the attributes and keywords mentioned in the Query. Note: retain table titles and source information.`;
      const info = await constructTable(dir, instruction, docs);
      return info;
    }
    case "algorithm": {
      const instruction = `Query is ${query}, please extract relevant algorithms from the document based on the Query.`;
      const info = await constructAlgorithm(dir, instruction, docs);
      return info;
    }
    case "catalogue": {
      const instruction = `Query is ${query}, please extract relevant catalogues from the document based on the Query.`;
      const info = await constructCatalogue(dir, instruction, docs);
      return info;
    }
    case "chunk": {
      // const instruction = "construct chunk";
      const info = constructChunk(docs);
      return info;
    }
  }
};

const constructGraph = async (
  dir: string,
  instruction: string,
  docs: { title: string; content: string }[],
): Promise<string> => {
  console.log("constructGraph...");

  const systemPrompt = await loadPrompt("construct_graph");
  let graphInfo = "";

  const graphs: string[] = [];
  const titles = docs.map((d) => d.title).join("\n");

  for (const { title, content } of docs) {
    const { text } = await generateText({
      model: openai("gpt-4o"),
      system: systemPrompt,
      prompt:
        "Requirement:\n" +
        `${instruction}\n\n` +
        "Noting:\n" +
        "You only need to consider the following paper titles,\n" +
        `${titles}\n\n` +
        "Raw Content:\n" +
        `${content}\n\n` +
        "Output:",
    });

    graphs.push(`${title}: ${text}`);
    graphInfo += text.split("\n", 1)[0].slice(0, 128);
  }

  await writeFileToTmpDir(dir, "graphs.json", graphs);

  return graphInfo;
};

const constructTable = async (
  dir: string,
  instruction: string,
  docs: { title: string; content: string }[],
): Promise<string> => {
  console.log("constructTable...");

  let info = "";
  const tables: string[] = [];

  const systemPrompt = await loadPrompt("construct_table");

  for (const { title, content } of docs) {
    const { text } = await generateText({
      model: openai("gpt-4o"),
      system: systemPrompt,
      prompt:
        "Raw Content:\n" +
        `${content}\n\n` +
        "Requirement:\n" +
        `${instruction}\n\n` +
        "Output:",
    });
    tables.push(`${title}: ${text}`);
    info += text.split("\n", 1)[0].slice(0, 128);
  }

  await writeFileToTmpDir(dir, "table.json", tables);

  return info;
};

const constructAlgorithm = async (
  dir: string,
  instruction: string,
  docs: { title: string; content: string }[],
): Promise<string> => {
  console.log("constructTable...");

  const systemPrompt = await loadPrompt("construct_algorithm");
  let info = "";
  const algorithms: string[] = [];

  for (const { title, content } of docs) {
    const { text } = await generateText({
      model: openai("gpt-4o"),
      system: systemPrompt,
      prompt:
        "Requirement:\n" +
        `${instruction}\n\n` +
        "Raw Content:\n" +
        `${content}\n\n` +
        "Output:",
    });

    algorithms.push(`${title}: ${text}`);
    info += text.split("\n", 1)[0].slice(0, 128);
  }

  await writeFileToTmpDir(dir, "algorithms.json", algorithms);

  return info;
};

const constructCatalogue = async (
  dir: string,
  instruction: string,
  docs: { title: string; content: string }[],
): Promise<string> => {
  console.log("constructTable...");

  const systemPrompt = await loadPrompt("construct_catalogue");
  let info = "";

  const catalogues: string[] = [];

  for (const { title, content } of docs) {
    const { text } = await generateText({
      model: openai("gpt-4o"),
      system: systemPrompt,
      prompt:
        "Requirement:\n" +
        `${instruction}\n\n` +
        "Raw Content:\n" +
        `${content}\n\n` +
        "Output:",
    });

    catalogues.push(`${title}: ${text}`);
    info += text.split("\n", 1)[0].slice(0, 128);
  }

  await writeFileToTmpDir(dir, "catalogues.json", catalogues);

  return info;
};

const constructChunk = async (
  docs: { title: string; content: string }[],
): Promise<string> => {
  console.log("constructChunk...");
  return docs.map((d) => d.title).join(" ");
};
