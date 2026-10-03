import { describe, it, expect, vi } from "vitest";
import { readFileSync } from "node:fs";
import { transform } from "esbuild";

// Exercise the actual session implementation with an isolated transport;
// no real session secrets or backend credentials are used.
async function sessionImplementation(
  query: ReturnType<typeof vi.fn>,
  action = vi.fn(),
) {
  const source = readFileSync(
    new URL("../../src/lib/server/auth-session.ts", import.meta.url),
    "utf8",
  )
    .replace(/^import[\s\S]*?from ["'][^"']+["'];\s*/gm, "")
    .replace(/export /g, "");
  const compiled = await transform(source, { loader: "ts", target: "es2022" });
  const Client = class {
    setAuth = vi.fn();
    query = query;
    action = action;
  };
  return new Function(
    "ConvexHttpClient",
    "makeFunctionReference",
    "env",
    `${compiled.code}; return sessionToken;`,
  )(Client, (name: string) => name, {
    PUBLIC_CONVEX_URL: "https://test.convex.cloud",
  });
}
function cookies(values: Record<string, string>) {
  return { get: (key: string) => values[key], set: vi.fn(), delete: vi.fn() };
}
describe("request-local verified session reuse", () => {
  it("returns a backend-verified profile with one verification call", async () => {
    const profile = { _id: "buyer", role: "CLIENT" };
    const query = vi.fn().mockResolvedValue(profile);
    const sessionToken = await sessionImplementation(query);
    const locals: Record<string, unknown> = {};
    expect(
      await sessionToken(
        cookies({ __convexAuthJWT: "signed-token" }),
        new URL("https://example.com"),
        false,
        locals,
      ),
    ).toBe("signed-token");
    expect(query).toHaveBeenCalledTimes(1);
    expect(locals.user).toEqual(profile);
  });
  it("does not share profiles across requests or trust an invalid token", async () => {
    const query = vi
      .fn()
      .mockResolvedValueOnce({ _id: "first", role: "CLIENT" })
      .mockRejectedValueOnce(new Error("invalid signature"));
    const sessionToken = await sessionImplementation(query);
    const first: Record<string, unknown> = {},
      second: Record<string, unknown> = {};
    await sessionToken(
      cookies({ __convexAuthJWT: "first-token" }),
      new URL("https://example.com"),
      false,
      first,
    );
    const secondCookies = cookies({ __convexAuthJWT: "forged-token" });
    expect(
      await sessionToken(
        secondCookies,
        new URL("https://example.com"),
        false,
        second,
      ),
    ).toBeNull();
    expect(first.user).toMatchObject({ _id: "first" });
    expect(second.user).toBeUndefined();
    expect(secondCookies.delete).toHaveBeenCalled();
  });
  it("stores only the profile verified after refresh rotation", async () => {
    const query = vi
      .fn()
      .mockResolvedValue({ _id: "refreshed", role: "AGENT" });
    const action = vi
      .fn()
      .mockResolvedValue({
        tokens: { token: "new-token", refreshToken: "new|refresh" },
      });
    const sessionToken = await sessionImplementation(query, action);
    const locals: Record<string, unknown> = {},
      saved = cookies({ __convexAuthRefresh: "old|refresh" });
    expect(
      await sessionToken(saved, new URL("https://example.com"), false, locals),
    ).toBe("new-token");
    expect(query).toHaveBeenCalledTimes(1);
    expect(action).toHaveBeenCalledTimes(1);
    expect(saved.set).toHaveBeenCalledTimes(2);
    expect(locals.user).toMatchObject({ _id: "refreshed" });
  });
});
