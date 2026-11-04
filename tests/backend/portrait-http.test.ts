import { beforeAll, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { transform } from "esbuild";
let code = "";
beforeAll(async () => {
  const source = readFileSync(
    new URL("../../src/routes/api/profile/photo/+server.ts", import.meta.url),
    "utf8",
  )
    .replace(/^import[\s\S]*?from ["'][^"']+["'];\s*/gm, "")
    .replace(/export /g, "");
  code = (await transform(source, { loader: "ts", target: "es2022" })).code;
});
async function submit({
  token = "trusted-session",
  origin = "https://app.example",
  type = "image/png",
} = {}) {
  const client = {
    setAuth: vi.fn(),
    mutation: vi
      .fn()
      .mockResolvedValue({
        url: "https://storage.example/upload",
        intentId: "intent",
      }),
    action: vi.fn(),
    query: vi
      .fn()
      .mockResolvedValue({ avatarUrl: "https://storage.example/portrait.png" }),
  };
  const fetcher = vi
    .fn()
    .mockResolvedValue(
      new Response(JSON.stringify({ storageId: "owned-file" })),
    );
  const post = new Function(
    "json",
    "sessionToken",
    "authClient",
    "api",
    "prepareUploadFile",
    "fetch",
    code + ";return POST;",
  )(
    (body: any, init: any = {}) => new Response(JSON.stringify(body), init),
    async () => token,
    () => client,
    {
      storage: { generateUploadUrl: "generate", registerUpload: "register" },
      users: { getMyProfile: "profile" },
    },
    async (file: File) => file,
    fetcher,
  );
  const form = new FormData();
  form.set(
    "file",
    new File([new Uint8Array([137, 80, 78, 71])], "portrait.png", { type }),
  );
  const response = await post({
    request: new Request("https://app.example/api/profile/photo", {
      method: "POST",
      headers: { origin },
      body: form,
    }),
    cookies: {},
    locals: {},
    url: new URL("https://app.example/api/profile/photo"),
  });
  return { response, client, fetcher };
}
describe("session-authenticated portrait upload transport", () => {
  it("uses the trusted server session and registers the uploaded owner file before returning its URL", async () => {
    const { response, client, fetcher } = await submit();
    expect(response.status).toBe(200);
    expect(client.setAuth).toHaveBeenCalledWith("trusted-session");
    expect(fetcher).toHaveBeenCalledOnce();
    expect(client.action).toHaveBeenCalledWith(
      "register",
      expect.objectContaining({
        purpose: "AVATAR_IMAGE",
        storageId: "owned-file",
        intentId: "intent",
        sha256: expect.stringMatching(/^[0-9a-f]{64}$/),
      }),
    );
    expect(await response.json()).toEqual({
      avatarUrl: "https://storage.example/portrait.png",
    });
  });
  it("rejects cross-origin writes before touching storage", async () => {
    const { response, client } = await submit({
      origin: "https://evil.example",
    });
    expect(response.status).toBe(403);
    expect(client.mutation).not.toHaveBeenCalled();
  });
  it("rejects an expired session and non-image input", async () => {
    expect((await submit({ token: "" })).response.status).toBe(401);
    const { response, fetcher } = await submit({ type: "text/html" });
    expect(response.status).toBe(400);
    expect(fetcher).not.toHaveBeenCalled();
  });
});
