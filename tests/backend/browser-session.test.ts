import { afterEach, describe, expect, it, vi } from "vitest";
import {
  fetchSessionToken,
  synchronizeSession,
} from "../../src/lib/convex/session";
import type { ConvexClient } from "convex/browser";
afterEach(() => vi.unstubAllGlobals());
describe("browser authentication synchronization", () => {
  it("shares concurrent token requests and explicitly requests refresh", async () => {
    const fetch = vi.fn(
      async (_url: string) =>
        new Response(JSON.stringify({ token: "verified-token" }), {
          status: 200,
        }),
    );
    vi.stubGlobal("fetch", fetch);
    expect(
      await Promise.all([
        fetchSessionToken({ forceRefreshToken: true }),
        fetchSessionToken({ forceRefreshToken: true }),
      ]),
    ).toEqual(["verified-token", "verified-token"]);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch.mock.calls[0][0]).toBe("/api/auth/session?refresh=1");
  });
  it("does not treat an unavailable backend as successful authentication", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("Unavailable", { status: 503 })),
    );
    await expect(
      fetchSessionToken({ forceRefreshToken: false }),
    ).rejects.toThrow(/could not be verified/);
    const client = {
      setAuth: (_fetch: unknown, callback: (authenticated: boolean) => void) =>
        callback(false),
    } as unknown as ConvexClient;
    await expect(synchronizeSession(client)).rejects.toThrow(/expired/);
  });
});
