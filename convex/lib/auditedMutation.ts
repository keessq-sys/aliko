import { customMutation } from "convex-helpers/server/customFunctions";
import { mutation } from "../_generated/server";
import { emitAlert } from "./alerts";
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
