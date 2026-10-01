import { exportJWK, exportPKCS8, generateKeyPair } from "jose";
import { randomBytes } from "node:crypto";
import { spawnSync } from "node:child_process";
import path from "node:path";
const cli = path.resolve("node_modules/convex/bin/main.js");
function run(args) {
  const result = spawnSync(process.execPath, [cli, ...args], {
    encoding: "utf8",
    shell: false,
  });
  if (result.status !== 0)
    throw new Error("Convex authentication configuration failed");
  return result.stdout;
}
const names = run(["env", "list", "--prod", "--names-only"]).split(/\r?\n/);
if (!names.includes("JWT_PRIVATE_KEY") || !names.includes("JWKS")) {
  if (names.includes("JWT_PRIVATE_KEY") || names.includes("JWKS"))
    throw new Error(
      "Authentication key pair is incomplete; refusing to overwrite",
    );
  const keys = await generateKeyPair("RS256", { extractable: true });
  run([
    "env",
    "set",
    "--prod",
    "JWT_PRIVATE_KEY",
    "--",
    await exportPKCS8(keys.privateKey),
  ]);
  run([
    "env",
    "set",
    "JWKS",
    JSON.stringify({
      keys: [{ use: "sig", ...(await exportJWK(keys.publicKey)) }],
    }),
    "--prod",
  ]);
  console.log("Authentication signing keys configured securely.");
}
if (!names.includes("MFA_ENCRYPTION_KEY")) {
  run([
    "env",
    "set",
    "MFA_ENCRYPTION_KEY",
    randomBytes(32).toString("base64"),
    "--prod",
  ]);
  console.log("Administrator MFA encryption configured.");
}
