import { mkdir, rm } from "fs/promises";
import os from "os";
import path from "path";
import { getTitleAndContent } from "@/lib/actions/resources";
import { selectStructure } from "./router";
import { construct } from "./structurizer";
import { decompose, extract, merge } from "./utilizer";

const executeStructRAG = async (
  dir: string,
  question: string,
): Promise<string> => {
  // TODO: In the original code, each question is wrapped in a `prompt_template`, and a specific instruction is added.
  const query = question; // `#Papers:\n......\n\n${instruction}\n\n#The paper you need to analyze:\n${question}`;
  const docs = await getTitleAndContent();
  const titles = docs.map((doc) => doc.title);

  // 1. router
  const selectedStruct = await selectStructure(
    "The titles of the docs are: " + titles.join("\n"),
    query,
  );
  console.log("selectedStruct:", selectedStruct);

  // 2. structurizer
  // get the knowledge base info
  const kbInfo = await construct(dir, query, selectedStruct, docs);
  console.log("knowledge base info:", kbInfo);

  // 3. utilizer
  const subqueries = await decompose(query, kbInfo);
  const subknowledges = await extract(dir, subqueries, selectedStruct, docs);
  const answer = await merge(query, subqueries, subknowledges, selectedStruct);

  return answer;
};

export const getInformationWithStructRAG = async (
  question: string,
): Promise<string> => {
  const dir = path.join(os.tmpdir(), `sess-${crypto.randomUUID()}`);
  await mkdir(dir, { recursive: true });

  try {
    return await executeStructRAG(dir, question);
  } catch (error) {
    console.error(error);
    throw new Error("error executing StructRAG");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
};
