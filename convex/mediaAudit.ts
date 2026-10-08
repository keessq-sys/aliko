import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { query, internalQuery } from "./_generated/server";
import { requireAdmin } from "./lib/access";
const args = {
  table: v.union(v.literal("storedAssets"), v.literal("r2Assets")),
  paginationOpts: paginationOptsValidator,
};
async function inspect(ctx: any, input: any) {
  const result = await ctx.db.query(input.table).paginate(input.paginationOpts);
  return {
    ...result,
    page: result.page.map((asset: any) => ({
      id: asset._id,
      fileName: asset.fileName,
      status: asset.status,
      securityVersion: asset.securityVersion,
      scannedAt: asset.scannedAt,
      needsReview:
        asset.status === "ACTIVE" &&
        ![
          "2026-10-01-decode-scan-v1",
          "2026-10-08-local-image-validation-v1",
          "2026-10-08-upload-metadata-v1",
        ].includes(asset.securityVersion),
    })),
  };
}
export const page = query({
  args,
  handler: async (ctx, input) => {
    await requireAdmin(ctx);
    return inspect(ctx, input);
  },
});
export const inspectInternal = internalQuery({ args, handler: inspect });
