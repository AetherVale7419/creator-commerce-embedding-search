import { describe, expect, it } from "vitest";
import { rankDeliverableDocuments, type CreatorDocument } from "../src/creator_search";

const documents: CreatorDocument[] = [
  {
    id: "public-guide",
    title: "Public guide",
    body: "",
    access: "public",
    deliveryPath: "/downloads/guide.pdf",
    processingState: "ready",
    embedding: [0.6, 0.4]
  },
  {
    id: "subscriber-pack",
    title: "Subscriber preset pack",
    body: "",
    access: "subscriber",
    deliveryPath: "/downloads/presets.zip",
    processingState: "ready",
    embedding: [1, 0]
  }
];

describe("creator asset delivery", () => {
  it("only returns the closest subscriber asset to an active subscriber", () => {
    const visitorHits = rankDeliverableDocuments(documents, [1, 0], false, 2);
    const subscriberHits = rankDeliverableDocuments(documents, [1, 0], true, 1);

    expect(visitorHits.map((hit) => hit.id)).toEqual(["public-guide"]);
    expect(subscriberHits.map((hit) => hit.id)).toEqual(["subscriber-pack"]);
    expect(subscriberHits[0].deliveryPath).toBe("/downloads/presets.zip");
  });
});
