import { promises as fs } from "fs";

/** Reads a text file and returns its contents. */
export async function loadPrompt(filename: string): Promise<string> {
  const path = `lib/ai/prompts/${filename}.txt`;
  return await fs.readFile(path, "utf8");
}

/**
 * Reads a template file and substitutes {{placeholders}} with values in `params`.
 */
export async function loadAndFormatPrompt(
  filename: string,
  params: Record<string, string>,
): Promise<string> {
  // Load file
  const path = `lib/ai/prompts/${filename}.txt`;
  const template = await fs.readFile(path, "utf8");

  // Repalce params
  return template.replace(/{\s*(\w+)\s*}/g, (_, key) => {
    if (!(key in params)) throw new Error(`Missing param: ${key}`);

    return params[key];
  });
}
