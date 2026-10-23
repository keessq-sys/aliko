import { afterEach, describe, expect, it, vi } from "vitest";
import { uploadMedia } from "../../src/lib/media/upload";
afterEach(() => vi.unstubAllGlobals());
const json = (body: unknown, status: number) => Response.json(body, { status });
describe("media upload recovery", () => {
  it("recovers one missing-cookie request after checking the current session", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(json({ error: "sign in" }, 401))
      .mockResolvedValueOnce(json({ token: "verified" }, 200))
      .mockResolvedValueOnce(json({ url: "/api/media/owned.png" }, 201));
    vi.stubGlobal("fetch", fetch);
    const form = new FormData();
    expect(await uploadMedia(form)).toEqual({ url: "/api/media/owned.png" });
    expect(fetch.mock.calls.map((call) => call[0])).toEqual([
      "/api/media/upload",
      "/api/auth/session",
      "/api/media/upload",
    ]);
    expect(fetch.mock.calls[2][1].body).toBe(form);
  });
  it("preserves a real permission denial without rotating or retrying", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue(json({ error: "Subscription expired" }, 403));
    vi.stubGlobal("fetch", fetch);
    await expect(uploadMedia(new FormData())).rejects.toThrow(
      "Subscription expired",
    );
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it("identifies an HTML gateway 403 with a support reference", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue(
        new Response("<html>blocked</html>", {
          status: 403,
          headers: { "cf-ray": "diagnostic-reference" },
        }),
      );
    vi.stubGlobal("fetch", fetch);
    await expect(uploadMedia(new FormData())).rejects.toThrow(
      /security gateway.*diagnostic-reference/,
    );
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it("keeps an unavailable verification provider distinct from an expired session", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(json({}, 401))
        .mockResolvedValueOnce(json({}, 503)),
    );
    await expect(uploadMedia(new FormData())).rejects.toThrow(
      /temporarily unavailable/,
    );
  });
});
