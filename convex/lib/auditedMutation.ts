import { Triggers } from "convex-helpers/server/triggers";
import type { DataModel } from "../_generated/dataModel";
import { propertyAggregate, publicPropertyAggregate } from "../aggregates";
const triggers = new Triggers<DataModel>();
triggers.register("properties", async (ctx, change) => {
  if (change.newDoc) {
    const searchText = [
      change.newDoc.title,
      change.newDoc.location,
      change.newDoc.state,
      change.newDoc.lga,
      change.newDoc.type,
      change.newDoc.description,
    ]
      .join(" ")
      .slice(0, 12000);
    if (change.newDoc.searchText !== searchText)
      await ctx.db.patch(change.newDoc._id, { searchText });
  }
  for (const aggregate of [propertyAggregate, publicPropertyAggregate]) {
    if (change.newDoc && change.oldDoc)
      await aggregate.replaceOrInsert(ctx, change.oldDoc, change.newDoc);
    else if (change.newDoc)
      await aggregate.insertIfDoesNotExist(ctx, change.newDoc);
    else if (change.oldDoc) await aggregate.deleteIfExists(ctx, change.oldDoc);
  }
});
import { customMutation } from "convex-helpers/server/customFunctions";
import { mutation } from "../_generated/server";
import { emitAlert } from "./alerts";
import { requireUser } from "./access";

/** Record successful authenticated writes atomically, without storing arguments or results. */
export function auditedMutation(
  operation: string,
  options: { allowAnonymous?: boolean } = {},
) {
  return customMutation(mutation, {
    args: {},
    input: async (ctx) => {
      const actor = options.allowAnonymous
        ? await requireUser(ctx).catch(() => null)
        : await requireUser(ctx);
      return {
        ctx: triggers.wrapDB(ctx),
        args: {},
        onSuccess: async () => {
          if (!actor) return;
          const eventKey = `activity:${crypto.randomUUID()}`;
          await emitAlert(ctx, {
            userId: actor._id,
            eventKey,
            title: "Account activity recorded",
            message:
              "Your action completed successfully. Review the relevant workspace for its current status.",
            href: "/dashboard/notifications",
            category: "ACTIVITY",
            email: false,
          });
          if (actor.role !== "ADMIN") {
            const admins = await ctx.db
              .query("users")
              .withIndex("by_role_created", (q) => q.eq("role", "ADMIN"))
              .take(10);
            for (const admin of admins)
              await emitAlert(ctx, {
                userId: admin._id,
                eventKey,
                title: "Workspace activity",
                message:
                  "An authenticated account completed an action. Review the activity log for details.",
                href: "/admin/users",
                category: "ACTIVITY",
                email: false,
              });
          }
          await ctx.db.insert("adminAuditLog", {
            actorId: actor._id,
            action: "OPERATION_COMPLETED",
            entityType: "function",
            entityId: operation,
            createdAt: Date.now(),
          });
        },
      };
    },
  });
}
