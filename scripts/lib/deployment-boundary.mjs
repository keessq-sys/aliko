export const PRODUCTION_DEPLOYMENT = "gallant-husky-352";
/** @param {string | undefined} value */
export function isolatedEndpoint(value) {
  const url = new URL(value || "https://invalid.invalid");
  if (
    url.protocol !== "https:" ||
    !/^[a-z]+-[a-z]+-\d+(?:\.[a-z0-9-]+)?\.convex\.cloud$/.test(url.hostname) ||
    url.hostname.split(".")[0] === PRODUCTION_DEPLOYMENT ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  )
    throw new Error(
      "A separate HTTPS Convex deployment is required; production is forbidden",
    );
  return {
    url: url.origin,
    httpUrl: url.origin.replace(/\.convex\.cloud$/, ".convex.site"),
  };
}
/** @param {string | undefined} key
 * @param {string | undefined} kind
 * @param {string | undefined} expected */
export function assertIsolatedKey(key, kind, expected = undefined) {
  if (!["preview", "staging"].includes(kind ?? ""))
    throw new Error("Unknown isolated deployment kind");
  if (!key || key.includes(PRODUCTION_DEPLOYMENT))
    throw new Error("Production credentials are forbidden outside production");
  if (kind === "preview" && !key.startsWith("preview:"))
    throw new Error("A dedicated preview deploy key is required");
  if (
    kind === "staging" &&
    (!expected ||
      expected === PRODUCTION_DEPLOYMENT ||
      !key.startsWith(`prod:${expected}|`))
  )
    throw new Error(
      "A matching dedicated staging deployment key and deployment name are required",
    );
}
