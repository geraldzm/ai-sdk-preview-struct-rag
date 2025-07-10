import { getTitleAndContent } from "@/lib/actions/resources";
import { selectStructure } from "./router";
import { construct } from "./structurizer";
import { decompose, extract, merge } from "./utilizer";

export const getInformationWithStructRAG = async (
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
  const kb = await construct(query, selectedStruct, docs);
  console.log("knowledge base info:", kb);

  // 3. utilizer
  const subqueries = await decompose(query, kb.truncatedKbInfo);
  const subknowledges = await extract(subqueries, selectedStruct, kb.kbInfo);
  const answer = await merge(query, subqueries, subknowledges, selectedStruct);

  return answer;
};
