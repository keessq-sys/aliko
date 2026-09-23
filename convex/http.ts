import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

async function hmacHex(
  algorithm: "SHA-256" | "SHA-512",
  secret: string,
  body: string,
) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: algorithm },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
  return [...new Uint8Array(signature)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function constantTimeEqual(left: string, right: string) {
  if (left.length !== right.length) return false;
  let mismatch = 0;
  for (let i = 0; i < left.length; i++)
    mismatch |= left.charCodeAt(i) ^ right.charCodeAt(i);
  return mismatch === 0;
}

const MAX_WEBHOOK_BYTES = 1_000_000;

async function readWebhookBody(req: Request) {
  const declared = Number(req.headers.get("content-length") ?? 0);
  if (declared > MAX_WEBHOOK_BYTES) throw new Error("PAYLOAD_TOO_LARGE");
  const raw = await req.text();
  if (new TextEncoder().encode(raw).byteLength > MAX_WEBHOOK_BYTES)
    throw new Error("PAYLOAD_TOO_LARGE");
  return raw;
}

async function sha256Hex(value: string) {
  const bytes = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return [...new Uint8Array(bytes)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Webhook processing failed";
}

const http = httpRouter();

// ── Flutterwave Webhook ───────────────────────────────────────────────────
// Flutterwave signs webhook deliveries with the secret hash configured in
// Dashboard > Settings > Webhooks. A signed event is still only a signal: we
// re-query Flutterwave's transaction API before recording any payment.
http.route({
  path: "/webhooks/flutterwave",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    const secretHash = process.env.FLUTTERWAVE_SECRET_HASH;
    if (!secretHash)
      return new Response("Webhook not configured", { status: 503 });
    const signature = req.headers.get("verif-hash");
    if (!signature || !constantTimeEqual(signature, secretHash)) {
      return new Response("Invalid signature", { status: 401 });
    }

    let rawBody: string;
    try {
      rawBody = await readWebhookBody(req);
    } catch {
      return new Response("Payload too large", { status: 413 });
    }
    const event = JSON.parse(rawBody) as {
      event?: string;
      data?: { id?: number | string; tx_ref?: string; status?: string };
    };
    if (
      event.event !== "charge.completed" ||
      event.data?.status !== "successful"
    ) {
      return new Response("ok", { status: 200 });
    }
    if (!event.data.id || !event.data.tx_ref)
      return new Response("Invalid payload", { status: 400 });

    const claim = await ctx.runMutation(internal.operations.claimWebhookEvent, {
      provider: "FLUTTERWAVE",
      eventId: String(event.data.id),
      eventType: event.event,
      reference: event.data.tx_ref,
      payloadDigest: await sha256Hex(rawBody),
    });
    if (!claim.claimed) return new Response("ok", { status: 200 });

    try {
      await ctx.runAction(internal.bookings.processFlutterwaveWebhook, {
        transactionId: String(event.data.id),
        reference: event.data.tx_ref,
      });
      await ctx.runMutation(internal.operations.finishWebhookEvent, {
        eventId: claim.eventId,
        status: "PROCESSED",
      });
      return new Response("ok", { status: 200 });
    } catch (error) {
      console.error("Flutterwave webhook verification failed", error);
      await ctx.runMutation(internal.operations.finishWebhookEvent, {
        eventId: claim.eventId,
        status: "FAILED",
        error: errorMessage(error),
      });
      return new Response("Verification failed", { status: 400 });
    }
  }),
});

// ── Paystack Webhook ───────────────────────────────────────────────────────
http.route({
  path: "/webhooks/paystack",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    let rawBody: string;
    try {
      rawBody = await readWebhookBody(req);
    } catch {
      return new Response("Payload too large", { status: 413 });
    }
    const signature = req.headers.get("x-paystack-signature");
    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) return new Response("Webhook not configured", { status: 503 });
    const expected = await hmacHex("SHA-512", secret, rawBody);

    if (!signature || !constantTimeEqual(signature, expected)) {
      return new Response("Invalid signature", { status: 401 });
    }

    const event = JSON.parse(rawBody) as {
      event: string;
      data: {
        reference: string;
        id: string;
        amount: number;
        channel: string;
        customer: { email: string };
      };
    };

    const eventId = `${event.event}:${event.data?.id ?? event.data?.reference ?? (await sha256Hex(rawBody))}`;
    const claim = await ctx.runMutation(internal.operations.claimWebhookEvent, {
      provider: "PAYSTACK",
      eventId,
      eventType: event.event,
      reference: event.data?.reference,
      payloadDigest: await sha256Hex(rawBody),
    });
    if (!claim.claimed) return new Response("ok", { status: 200 });

    try {
      if (event.event === "charge.success") {
        const {
          reference,
          id: providerReference,
          amount,
          channel,
        } = event.data;

        await ctx.runMutation(internal.bookings.confirmPayment, {
          reference,
          providerReference,
          amount: amount / 100, // convert kobo to naira
          channel,
          metadata: event.data,
        });

        // Settlement starts the durable deed/signature/allocation workflow.
      }
      await ctx.runMutation(internal.operations.finishWebhookEvent, {
        eventId: claim.eventId,
        status: event.event === "charge.success" ? "PROCESSED" : "IGNORED",
      });
      return new Response("ok", { status: 200 });
    } catch (error) {
      await ctx.runMutation(internal.operations.finishWebhookEvent, {
        eventId: claim.eventId,
        status: "FAILED",
        error: errorMessage(error),
      });
      return new Response("Processing failed", { status: 500 });
    }
  }),
});

// ── Dropbox Sign (e-signature) Webhook ────────────────────────────────────
http.route({
  path: "/webhooks/esign",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    let rawBody: string;
    try {
      rawBody = await readWebhookBody(req);
    } catch {
      return new Response("Payload too large", { status: 413 });
    }
    const signature = req.headers.get("x-hellosign-signature");
    const secret = process.env.DROPBOX_SIGN_API_KEY;
    if (!secret) return new Response("Webhook not configured", { status: 503 });
    const expected = await hmacHex("SHA-256", secret, rawBody);

    if (!signature || !constantTimeEqual(signature, expected)) {
      return new Response("Invalid signature", { status: 401 });
    }

    const decoded = decodeURIComponent(
      rawBody.replace(/^json=/, "").replace(/\+/g, " "),
    );
    const payload = JSON.parse(decoded) as {
      event: { event_type: string; event_time?: string; event_hash?: string };
      signature_request: { metadata: { referenceCode: string } };
    };

    const referenceCode = payload.signature_request?.metadata?.referenceCode;
    const claim = await ctx.runMutation(internal.operations.claimWebhookEvent, {
      provider: "DROPBOX_SIGN",
      eventId:
        payload.event.event_hash ??
        `${payload.event.event_type}:${payload.event.event_time ?? (await sha256Hex(rawBody))}`,
      eventType: payload.event.event_type,
      reference: referenceCode,
      payloadDigest: await sha256Hex(rawBody),
    });
    if (!claim.claimed)
      return new Response("Hello API Event Received", { status: 200 });

    if (payload.event.event_type === "signature_request_all_signed") {
      if (referenceCode) {
        await ctx.runMutation(internal.legalDocuments.updateDocumentStatus, {
          referenceCode,
          status: "SIGNED",
          actorRole: "CLIENT",
        });
      }
    }
    await ctx.runMutation(internal.operations.finishWebhookEvent, {
      eventId: claim.eventId,
      status:
        payload.event.event_type === "signature_request_all_signed"
          ? "PROCESSED"
          : "IGNORED",
    });

    // Dropbox Sign requires this exact response
    return new Response("Hello API Event Received", { status: 200 });
  }),
});

// ── WhatsApp Business Cloud API Webhook ───────────────────────────────────
http.route({
  path: "/webhooks/whatsapp",
  method: "GET",
  handler: httpAction(async (_ctx, req) => {
    const url = new URL(req.url);
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");
    if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
      return new Response(challenge ?? "", { status: 200 });
    }
    return new Response("Forbidden", { status: 403 });
  }),
});

http.route({
  path: "/webhooks/whatsapp",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    let rawBody: string;
    try {
      rawBody = await readWebhookBody(req);
    } catch {
      return new Response("Payload too large", { status: 413 });
    }
    const appSecret = process.env.WHATSAPP_APP_SECRET;
    if (!appSecret)
      return new Response("Webhook not configured", { status: 503 });
    const signature = req.headers.get("x-hub-signature-256");
    const expected = `sha256=${await hmacHex("SHA-256", appSecret, rawBody)}`;
    if (!signature || !constantTimeEqual(signature, expected)) {
      return new Response("Invalid signature", { status: 401 });
    }
    const body = JSON.parse(rawBody) as {
      entry?: {
        changes?: {
          value?: {
            messages?: {
              id?: string;
              from: string;
              type: string;
              text?: { body: string };
            }[];
          };
        }[];
      }[];
    };
    const message = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    if (message?.type === "text" && message.text?.body) {
      const digest = await sha256Hex(rawBody);
      const claim = await ctx.runMutation(
        internal.operations.claimWebhookEvent,
        {
          provider: "WHATSAPP",
          eventId: message.id ?? digest,
          eventType: "message.text",
          reference: message.from,
          payloadDigest: digest,
        },
      );
      if (claim.claimed) {
        await ctx.runMutation(internal.operations.queueIncomingWhatsApp, {
          phone: message.from,
          text: message.text.body.slice(0, 4000),
          eventId: claim.eventId,
        });
      }
    }
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

export default http;
