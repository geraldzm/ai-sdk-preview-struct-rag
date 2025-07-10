import { generateText } from "ai";
import { loadPrompt } from "../prompt-utils";
import { openai } from "@ai-sdk/openai";

export const construct = async (
  query: string,
  chosen: "table" | "graph" | "algorithm" | "catalogue" | "chunk",
  docs: { title: string; content: string }[],
): Promise<{ truncatedKbInfo: string; kbInfo: string[] }> => {
  switch (chosen) {
    case "graph": {
      const instruction =
        "Based on the given document, construct a graph where entities are the titles of papers and the relation is 'reference', using the given document title as the head and other paper titles as tails.";
      const kb = await constructGraph(instruction, docs);
      return kb;
    }
    case "table": {
      const instruction = `Query is ${query}, please extract relevant complete tables from the document based on the attributes and keywords mentioned in the Query. Note: retain table titles and source information.`;
      const kb = await constructTable(instruction, docs);
      return kb;
    }
    case "algorithm": {
      const instruction = `Query is ${query}, please extract relevant algorithms from the document based on the Query.`;
      const kb = await constructAlgorithm(instruction, docs);
      return kb;
    }
    case "catalogue": {
      const instruction = `Query is ${query}, please extract relevant catalogues from the document based on the Query.`;
      const kb = await constructCatalogue(instruction, docs);
      return kb;
    }
    case "chunk": {
      // const instruction = "construct chunk";
      const kb = constructChunk(docs);
      return kb;
    }
  }
};

const constructGraph = async (
  instruction: string,
  docs: { title: string; content: string }[],
): Promise<{ truncatedKbInfo: string; kbInfo: string[] }> => {
  console.log("constructGraph...");

  const systemPrompt = await loadPrompt("construct_graph");
  let truncatedKbInfo = "";

  const kbInfo: string[] = [];
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

    kbInfo.push(`${title}: ${text}`);
    truncatedKbInfo += text.split("\n", 1)[0].slice(0, 128);
  }

  return { truncatedKbInfo, kbInfo };
};

const constructTable = async (
  instruction: string,
  docs: { title: string; content: string }[],
): Promise<{ truncatedKbInfo: string; kbInfo: string[] }> => {
  console.log("constructTable...");

  let truncatedKbInfo = "";
  const kbInfo: string[] = [];

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
    kbInfo.push(`${title}: ${text}`);
    truncatedKbInfo += text.split("\n", 1)[0].slice(0, 128);
  }

  return { truncatedKbInfo, kbInfo };
};

const constructAlgorithm = async (
  instruction: string,
  docs: { title: string; content: string }[],
): Promise<{ truncatedKbInfo: string; kbInfo: string[] }> => {
  console.log("constructTable...");

  const systemPrompt = await loadPrompt("construct_algorithm");
  let truncatedKbInfo = "";
  const kbInfo: string[] = [];

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

    kbInfo.push(`${title}: ${text}`);
    truncatedKbInfo += text.split("\n", 1)[0].slice(0, 128);
  }

  return { truncatedKbInfo, kbInfo };
};

const constructCatalogue = async (
  instruction: string,
  docs: { title: string; content: string }[],
): Promise<{ truncatedKbInfo: string; kbInfo: string[] }> => {
  console.log("constructTable...");

  const systemPrompt = await loadPrompt("construct_catalogue");
  let truncatedKbInfo = "";
  const kbInfo: string[] = [];

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

    kbInfo.push(`${title}: ${text}`);
    truncatedKbInfo += text.split("\n", 1)[0].slice(0, 128);
  }

  return { truncatedKbInfo, kbInfo };
};

const constructChunk = async (
  docs: { title: string; content: string }[],
): Promise<{ truncatedKbInfo: string; kbInfo: string[] }> => {
  console.log("constructChunk...");

  let truncatedKbInfo = "";
  const kbInfo: string[] = [];

  for (const { title, content } of docs) {
    kbInfo.push(`${title}: ${content}`);
    truncatedKbInfo += ` ${title}`;
  }

  return {
    truncatedKbInfo: truncatedKbInfo.trimStart(),
    kbInfo,
  };
};
