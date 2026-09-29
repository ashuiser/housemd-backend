import { OpenAIEmbeddings } from "@langchain/openai";
import { PineconeStore } from "@langchain/pinecone";
import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";
import { env } from "../../config/env.js";

export const pinecone = new PineconeClient({
  apiKey: env.PINECONE_API_KEY,
});

const pineconeIndex = pinecone.Index(env.PINECONE_INDEX);

const embeddings = new OpenAIEmbeddings({
  model: "text-embedding-3-small",
  apiKey: env.OPENAI_API_KEY,
});

export async function getVectorStore(namespace: string) {
  const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
    pineconeIndex,
    maxConcurrency: 5,
    namespace: namespace,
  });

  return vectorStore;
}
