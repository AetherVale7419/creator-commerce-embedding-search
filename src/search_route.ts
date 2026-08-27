import { createServer, type ServerResponse } from "node:http";
import { z } from "zod";
import {
  embed,
  rankDeliverableDocuments,
  searchableText,
  type CreatorDocument
} from "./creator_search";

const searchBody = z.object({
  query: z.string().trim().min(2).max(200),
  subscriber: z.boolean(),
  limit: z.number().int().min(1).max(10).default(3)
});

const sourceDocuments: Array<Omit<CreatorDocument, "embedding">> = [
  {
    id: "lighting-notes",
    title: "Window-light field notes",
    body: "A processed PDF about shaping natural light for product photographs.",
    access: "public",
    deliveryPath: "/downloads/window-light-notes.pdf",
    processingState: "ready"
  },
  {
    id: "presets-summer",
    title: "Summer product photo presets",
    body: "Subscriber update with the latest Lightroom preset pack and delivery notes.",
    access: "subscriber",
    deliveryPath: "/downloads/summer-presets.zip",
    processingState: "ready"
  },
  {
    id: "audio-export-guide",
    title: "Clean audio export guide",
    body: "A processed guide for preparing podcast downloads.",
    access: "public",
    deliveryPath: "/downloads/audio-export-guide.pdf",
    processingState: "ready"
  }
];

let indexPromise: Promise<CreatorDocument[]> | undefined;

function loadIndex(): Promise<CreatorDocument[]> {
  indexPromise ??= embed(sourceDocuments.map(searchableText)).then((embeddings) =>
    sourceDocuments.map((document, index) => ({ ...document, embedding: embeddings[index] }))
  );
  return indexPromise;
}

function sendJson(response: ServerResponse, status: number, value: unknown): void {
  response.writeHead(status, { "content-type": "application/json" });
  response.end(JSON.stringify(value));
}

export const server = createServer(async (request, response) => {
  if (request.method !== "POST" || request.url !== "/search") {
    sendJson(response, 404, { error: "Route not found" });
    return;
  }

  try {
    let raw = "";
    for await (const chunk of request) raw += chunk;
    const body = searchBody.parse(JSON.parse(raw));
    const [queryEmbedding] = await embed(body.query);
    const documents = await loadIndex();
    const hits = rankDeliverableDocuments(
      documents,
      queryEmbedding,
      body.subscriber,
      body.limit
    );
    sendJson(response, 200, { query: body.query, hits });
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof SyntaxError) {
      sendJson(response, 400, { error: "Invalid search body" });
      return;
    }
    console.error(error);
    sendJson(response, 502, { error: "Embedding request failed" });
  }
});

if (!process.env.INFRAI_API_KEY) {
  throw new Error("Set INFRAI_API_KEY before starting the search route");
}

const port = Number(process.env.PORT ?? 3000);
server.listen(port, () => console.log(`Creator search listening on http://localhost:${port}`));
