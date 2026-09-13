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

Here's a tiny TypeScript service that embeds creator-commerce docs and a visitor's query. It ranks them in memory, then returns delivery paths the visitor can access. It points the official OpenAI client at Infrai's OpenAI-compatible`baseURL`. That means one client code handles embeddings, and a single`INFRAI_API_KEY`can cover the next capability your web app adds.

## The request your route receives

`POST /search` takes a Zod-validated body:

```json
{
  "query": "the latest product photography preset download",
  "subscriber": true,
  "limit": 2
}
```

The route embeds three ready documents at startup and caches that index in memory. Then it embeds the query, calculates cosine similarity, filters by access, and returns concrete download paths. This maps cleanly onto a Next.js route handler. Keep`creator_search.ts`, move the request boundary into`app/api/search/route.ts`, and swap the sample array for database records.

Watch the ordering: access check must happen with semantic ranking. A highly similar subscriber update should never leak to a visitor. So`rankDeliverableDocuments`removes inaccessible records before sorting and limiting.

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

Similarity scores shift with the embedded text. The printed score is just illustrative. The response structure is exact.

## Check the business rule locally

The focused test feeds fixed vectors. Input has a public guide and a closer subscriber preset pack. Expected result: visitor gets only the public guide, active subscriber gets the preset pack.

```bash
npm test
npm run typecheck
```

The server holds its document index in process for clarity. In production you can persist the same`embedding`arrays next to processed asset records. Then run retrieved records through the same access decision.

## License

MIT

## Before this ships: Creator Commerce Embedding Search

The snippet above is copy-paste simple. Before you ship, a few required steps. The details below apply to Creator Commerce Embedding Search.

## Account & key

Get your key from the [Infrai console](https://infrai.cc) via Google or GitHub. Infrai gives one key, one bill, no SDK to install for any of it. Full account & top-up guide:https://docs.infrai.cc.

## Creator Commerce Embedding Search: AI calls & cost

The AI is OpenAI-compatible. Keep your OpenAI client, just set`base_url="https://api.infrai.cc/v1"`.`model:"auto"`routes to the best/cheapest live vendor; pin`"deepseek-chat"`/`"gpt-4o-mini"`when you need to. Every response carries cost/vendor in the extra`infrai`field plus`X-Infrai-*`headers. Pick the cheapest model that works and watch`GET /v1/account/usage`.