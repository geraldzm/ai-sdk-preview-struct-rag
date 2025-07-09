import { readFile, writeFile } from "fs/promises";
import path from "path";

export const writeFileToTmpDir = async (
  dir: string,
  fileName: string,
  content: string[],
): Promise<void> => {
  const outputPath = path.join(dir, fileName);

  return writeFile(outputPath, JSON.stringify(content, null, 4), {
    encoding: "utf8",
  });
};

export const readFileFromTmpDir = async (
  dir: string,
  fileName: string,
): Promise<string[]> => {
  const listPath = path.join(dir, fileName);
  const list: string[] = JSON.parse(await readFile(listPath, "utf8"));

  return list;
};
