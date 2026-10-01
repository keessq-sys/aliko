/** @param {Record<string, string | undefined>} env */
export function validateRestoreTarget(env) {
  const deployment = env.CONVEX_RESTORE_DEPLOYMENT;
  const key = env.CONVEX_STAGING_DEPLOY_KEY;
  if (!deployment || !/^[a-z]+-[a-z]+-\d+$/.test(deployment))
    throw new Error("Use the exact staging deployment name");
  if (deployment === "gallant-husky-352")
    throw new Error("Production restores are forbidden");
  if (!key || !key.startsWith(`prod:${deployment}|`))
    throw new Error("A matching dedicated staging deployment key is required");
  if (env.CONVEX_STAGING_URL !== `https://${deployment}.convex.cloud`)
    throw new Error("Confirm the exact staging deployment URL");
  if (env.CONFIRM_STAGING_RESTORE !== "RESTORE_TO_STAGING")
    throw new Error("Staging restore confirmation is required");
  return { deployment, key };
}
