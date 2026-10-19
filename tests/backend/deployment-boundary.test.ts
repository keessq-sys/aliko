import { describe, it, expect } from "vitest";
import {
  isolatedEndpoint,
  assertIsolatedKey,
} from "../../scripts/lib/deployment-boundary.mjs";
describe("deployment isolation", () => {
  it("rejects production URLs and unrelated origins", () => {
    for (const url of [
      "https://gallant-husky-352.eu-west-1.convex.cloud",
      "https://gallant-husky-352.convex.cloud",
      "https://example.com",
      "http://staging-test-123.convex.cloud",
    ])
      expect(() => isolatedEndpoint(url)).toThrow();
  });
  it("derives the matching isolated HTTP endpoint", () =>
    expect(
      isolatedEndpoint("https://staging-test-123.eu-west-1.convex.cloud"),
    ).toEqual({
      url: "https://staging-test-123.eu-west-1.convex.cloud",
      httpUrl: "https://staging-test-123.eu-west-1.convex.site",
    }));
  it("cannot use the production key for preview or staging", () => {
    expect(() =>
      assertIsolatedKey(
        "prod:gallant-husky-352|placeholder",
        "staging",
        "gallant-husky-352",
      ),
    ).toThrow();
    expect(() =>
      assertIsolatedKey("prod:staging-test-123|placeholder", "preview"),
    ).toThrow();
    expect(() =>
      assertIsolatedKey(
        "prod:staging-test-123|placeholder",
        "staging",
        "staging-test-123",
      ),
    ).not.toThrow();
  });
});
