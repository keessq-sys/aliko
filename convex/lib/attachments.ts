export async function validateAttachments(ctx: any, ownerId: any, ids: any[]) {
  if (ids.length > 10 || new Set(ids).size !== ids.length)
    throw new Error("Use at most 10 distinct attachments");
  for (const id of ids) {
    const asset = await ctx.db.get(id);
    if (
      !asset ||
      asset.ownerId !== ownerId ||
      asset.status !== "ACTIVE" ||
      (asset.expiresAt && asset.expiresAt <= Date.now())
    )
      throw new Error("Attachment is not owned, scanned or available");
  }
}
