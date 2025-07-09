"use server";

import {
  NewResourceParams,
  insertResourceSchema,
  resources,
} from "@/lib/db/schema/resources";
import { db } from "../db";
// import { embeddings as embeddingsTable } from "../db/schema/embeddings";

export const createResource = async (input: NewResourceParams) => {
  try {
    const { title, content } = insertResourceSchema.parse(input);

    // const [resource] = await db
    await db.insert(resources).values({ title, content });
    // .returning();
    console.log("Inserted into resources");

    // const embeddings = await generateEmbeddings(content);
    // await db.insert(embeddingsTable).values(
    //   embeddings.map((embedding) => ({
    //     resourceId: resource.id,
    //     ...embedding,
    //   })),
    // );
    return "Resource successfully created.";
  } catch (error) {
    console.error("some error occured", error);
    return error instanceof Error && error.message.length > 0
      ? error.message
      : "Error, please try again.";
  }
};

export const getTitleAndContent = async (): Promise<
  { title: string; content: string }[]
> => {
  return await db
    .select({ title: resources.title, content: resources.content })
    .from(resources);
};
