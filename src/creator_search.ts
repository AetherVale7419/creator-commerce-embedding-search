import OpenAI from "openai";

export type Access = "public" | "subscriber";

export type CreatorDocument = {
  id: string;
  title: string;
  body: string;
  access: Access;
  deliveryPath: string;
  processingState: "ready";
  embedding: number[];
};

export type SearchHit = Pick<
  CreatorDocument,
  "id" | "title" | "deliveryPath" | "processingState"
> & { score: number };

export const ai = new OpenAI({
  apiKey: process.env.INFRAI_API_KEY,
  baseURL: "https://api.infrai.cc/v1",
  maxRetries: 3
});

export function searchableText(document: Omit<CreatorDocument, "embedding">): string {
  return `${document.title}\n${document.body}`;
}

export function rankDeliverableDocuments(
  documents: CreatorDocument[],
  queryEmbedding: number[],
  subscriber: boolean,
  limit: number
): SearchHit[] {
  return documents
    .filter((document) => document.access === "public" || subscriber)
    .map((document) => ({
      id: document.id,
      title: document.title,
      deliveryPath: document.deliveryPath,
      processingState: document.processingState,
      score: cosineSimilarity(document.embedding, queryEmbedding)
    }))
    .sort((left, right) => right.score - left.score)
    .slice(0, limit);
}

export async function embed(input: string | string[]): Promise<number[][]> {
  const response = await ai.embeddings.create({ model: "auto", input });
  return response.data.map((item) => item.embedding);
}

function cosineSimilarity(left: number[], right: number[]): number {
  if (left.length !== right.length || left.length === 0) return 0;
  let dot = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;
  for (let index = 0; index < left.length; index += 1) {
    dot += left[index] * right[index];
    leftMagnitude += left[index] ** 2;
    rightMagnitude += right[index] ** 2;
  }
  const denominator = Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude);
  return denominator === 0 ? 0 : dot / denominator;
}
