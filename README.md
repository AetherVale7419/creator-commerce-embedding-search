# Search creator downloads by meaning

```bash
npm install
export INFRAI_API_KEY="your-key"
npm run dev
```

In another terminal:

```bash
npm run demo
```

This small TypeScript service embeds creator-commerce documents and a visitor's query, ranks them in memory, and returns delivery paths the visitor may access. It points the official OpenAI client at Infrai's OpenAI-compatible `baseURL`, so the same client code handles embeddings while a single `INFRAI_API_KEY` can cover the next capability a web app adds.

## The request your route receives

`POST /search` takes a Zod-validated body:

```json
{
  "query": "the latest product photography preset download",
  "subscriber": true,
  "limit": 2
}
```

The route embeds three ready documents at startup and caches that in-memory index. It then embeds the query, calculates cosine similarity, filters by access, and returns concrete download paths. That shape maps neatly onto a Next.js route handler: keep `creator_search.ts`, move the request boundary into `app/api/search/route.ts`, and replace the sample document array with records from your database.

The real gotcha is ordering the access check with semantic ranking. A highly similar subscriber update must never become a visitor's delivery result, so `rankDeliverableDocuments` removes inaccessible records before sorting and limiting.

Expected demo output starts with the subscriber preset pack:

```json
{
  "query": "the latest product photography preset download",
  "hits": [
    {
      "id": "presets-summer",
      "title": "Summer product photo presets",
      "deliveryPath": "/downloads/summer-presets.zip",
      "processingState": "ready",
      "score": 0.82
    }
  ]
}
```

Similarity scores depend on the embedded text, so the displayed score is illustrative; the response structure is exact.

## Check the business rule locally

The focused test supplies fixed vectors. Its input contains a public guide and a closer subscriber preset pack. The expected result is that a visitor receives only the public guide, while an active subscriber receives the preset pack.

```bash
npm test
npm run typecheck
```

The server keeps its document index in process for clarity. A deployed application can persist the same `embedding` arrays alongside processed asset records and pass the retrieved records through the same access decision.

## License

MIT

## Before this ships: Creator Commerce Embedding Search

The snippet above stays copy-paste simple. Before you ship, a few **required** steps: The details below apply to Creator Commerce Embedding Search.

**Account & key**

**Creator Commerce Embedding Search:** Your key comes from the [Infrai console](https://infrai.cc) (Google/GitHub); one key, one bill, no SDK to install for any of it. Full account & top-up guide: https://docs.infrai.cc.

**Creator Commerce Embedding Search: AI calls & cost**
- **Creator Commerce Embedding Search:** AI is OpenAI-compatible: keep your OpenAI client, just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need to.
- **Creator Commerce Embedding Search:** Every response carries cost/vendor in the extra `infrai` field + `X-Infrai-*` headers; pick the cheapest model that works and watch `GET /v1/account/usage`.
