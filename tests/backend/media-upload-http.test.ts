import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { transform } from "esbuild";

async function mediaGuard(sessionToken: ReturnType<typeof vi.fn>) {
  const source = readFileSync(
    new URL("../../src/hooks.server.ts", import.meta.url),
    "utf8",
  )
    .replace(/^import[\s\S]*?from ["'][^"']+["'];\s*/gm, "")
    .split("const sentryInit:")[0];
  const compiled = await transform(source, { loader: "ts", target: "es2022" });
  return new Function(
    "sessionToken",
    "env",
    "ConvexHttpClient",
    "makeFunctionReference",
    "redirect",
    `${compiled.code};return applicationHandle;`,
  )(
    sessionToken,
    { PUBLIC_CONVEX_URL: "https://test.convex.cloud" },
    class {
      setAuth() {}
    },
    (name: string) => name,
    vi.fn(),
  );
}
const event = () => ({
  request: new Request("https://app.example/api/media/upload", {
    method: "POST",
  }),
  url: new URL("https://app.example/api/media/upload"),
  locals: {},
  cookies: { get: () => undefined },
});
describe("media HTTP authorization failures", () => {
  it("returns recoverable 401 JSON for a missing session", async () => {
    const handle = await mediaGuard(vi.fn().mockResolvedValue(null));
    const response = await handle({ event: event(), resolve: vi.fn() });
    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({ code: "SESSION_REQUIRED" });
  });
  it("does not misreport a backend outage as forbidden", async () => {
    const handle = await mediaGuard(
      vi.fn().mockRejectedValue(new Error("network unavailable")),
    );
    const response = await handle({ event: event(), resolve: vi.fn() });
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ code: "AUTH_UNAVAILABLE" });
  });
  it("keeps unsupported roles and suspended accounts forbidden", async () => {
    for (const profile of [
      { _id: "buyer", role: "TENANT" },
      { _id: "admin", role: "ADMIN", accountStatus: "SUSPENDED" },
    ]) {
      const handle = await mediaGuard(
        vi.fn().mockResolvedValue("verified-token"),
      );
      const requestEvent = event();
      Object.assign(requestEvent.locals, { user: profile });
      const resolve = vi.fn();
      const response = await handle({ event: requestEvent, resolve });
      expect(response.status).toBe(403);
      expect(resolve).not.toHaveBeenCalled();
    }
  });
  it("allows a verified agent through to the upload handler", async () => {
    const handle = await mediaGuard(
      vi.fn().mockResolvedValue("verified-token"),
    );
    const requestEvent = event();
    Object.assign(requestEvent.locals, {
      user: { _id: "agent", role: "AGENT" },
    });
    const resolve = vi
      .fn()
      .mockResolvedValue(new Response("uploaded", { status: 201 }));
    expect((await handle({ event: requestEvent, resolve })).status).toBe(201);
    expect(resolve).toHaveBeenCalledOnce();
  });
});
