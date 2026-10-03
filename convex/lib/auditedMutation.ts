import { customMutation } from "convex-helpers/server/customFunctions";
import { mutation } from "../_generated/server";
import { requireUser } from "./access";

/** Record successful authenticated writes atomically, without storing arguments or results. */
export function auditedMutation(operation: string) {
  return customMutation(mutation, {
    args: {},
    input: async (ctx) => {
      const actor = await requireUser(ctx).catch(() => null);
      return {
        ctx: {},
        args: {},
        onSuccess: async () => {
          if (!actor) return;
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
