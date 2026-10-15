"use node";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import webpush from "web-push";
export const deliver = internalAction({
  args: {},
  handler: async (ctx): Promise<void> => {
    const publicKey = process.env.VAPID_PUBLIC_KEY,
      privateKey = process.env.VAPID_PRIVATE_KEY,
      subject = process.env.VAPID_SUBJECT;
    if (!publicKey || !privateKey || !subject) return;
    webpush.setVapidDetails(subject, publicKey, privateKey);
    const rows = await ctx.runMutation(internal.engagement.claimPush, {});
    for (const row of rows) {
      try {
        await webpush.sendNotification(
          {
            endpoint: row.device.endpoint,
            keys: { p256dh: row.device.p256dh, auth: row.device.auth },
          },
          JSON.stringify({
            title: "Aliko Diamond Key",
            body: "You have a private account update. Open your notification centre.",
            url: "/dashboard/notifications",
            tag: String(row.alert._id),
          }),
          { TTL: 3600, timeout: 15000 },
        );
        await ctx.runMutation(internal.engagement.finishPush, {
          id: row.id,
          leaseUntil: row.leaseUntil,
          ok: true,
          expired: false,
        });
      } catch (error) {
        const status = (error as { statusCode?: number }).statusCode;
        await ctx.runMutation(internal.engagement.finishPush, {
          id: row.id,
          leaseUntil: row.leaseUntil,
          ok: false,
          expired: status === 404 || status === 410,
          error: `Push provider status ${status ?? "unavailable"}`,
        });
      }
    }
  },
});
