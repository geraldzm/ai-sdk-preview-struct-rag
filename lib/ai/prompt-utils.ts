import { promises as fs } from "fs";

/** Reads a text file and returns its contents. */
export async function loadPrompt(filename: string): Promise<string> {
  const path = `lib/ai/prompts/${filename}.txt`;
  return await fs.readFile(path, "utf8");
}
