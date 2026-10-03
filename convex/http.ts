import { auth } from "./auth";
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

async function hmacBase64(secret: string, body: string) {
  const encoder = new TextEncoder();
  const normalizedSecret = secret.startsWith("whsec_") ? secret.slice(6) : null;
  const keyBytes = normalizedSecret
    ? Uint8Array.from(atob(normalizedSecret), (char) => char.charCodeAt(0))
    : encoder.encode(secret);
  const key = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
  let binary = "";
  for (const byte of new Uint8Array(signature))
    binary += String.fromCharCode(byte);
  return btoa(binary);
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
auth.addHttpRoutes(http);

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
      await ctx.runAction(
        event.data.tx_ref.startsWith("ADK-ORDER-")
          ? internal.checkout.processWebhook
          : internal.bookings.processFlutterwaveWebhook,
        {
          transactionId: String(event.data.id),
          reference: event.data.tx_ref,
        },
      );
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
    const secret = process.env.DROPBOX_SIGN_API_KEY;
    if (!secret) return new Response("Webhook not configured", { status: 503 });
    const declared = Number(req.headers.get("content-length") ?? 0);
    if (declared > MAX_WEBHOOK_BYTES)
      return new Response("Payload too large", { status: 413 });
    let json: string;
    try {
      const form = await req.formData();
      const field = form.get("json");
      if (typeof field !== "string") throw new Error("Missing json field");
      json = field;
    } catch {
      return new Response("Invalid callback payload", { status: 400 });
    }
    const signature = req.headers.get("content-sha256");
    const expected = await hmacBase64(secret, json);
    if (!signature || !constantTimeEqual(signature, expected)) {
      return new Response("Invalid signature", { status: 401 });
    }
    const payload = JSON.parse(json) as {
      event: { event_type: string; event_time?: string; event_hash?: string };
      signature_request: {
        signature_request_id: string;
        test_mode?: boolean;
        metadata: { referenceCode: string };
      };
    };

    const referenceCode = payload.signature_request?.metadata?.referenceCode;
    const claim = await ctx.runMutation(internal.operations.claimWebhookEvent, {
      provider: "DROPBOX_SIGN",
      eventId:
        payload.event.event_hash ??
        `${payload.event.event_type}:${payload.event.event_time ?? (await sha256Hex(json))}`,
      eventType: payload.event.event_type,
      reference: referenceCode,
      payloadDigest: await sha256Hex(json),
    });
    if (!claim.claimed)
      return new Response("Hello API Event Received", { status: 200 });

    try {
      const signatureOutcome: Record<
        string,
        "SIGNED" | "REJECTED" | "EXPIRED"
      > = {
        signature_request_all_signed: "SIGNED",
        signature_request_declined: "REJECTED",
        signature_request_expired: "EXPIRED",
      };
      const outcome = signatureOutcome[payload.event.event_type];
      if (outcome) {
        if (!referenceCode || !payload.signature_request?.signature_request_id)
          throw new Error("Missing registered signature request");
        await ctx.runMutation(internal.legalDocuments.updateDocumentStatus, {
          referenceCode,
          status: outcome,
          actorRole: "CLIENT",
          providerRequestId: payload.signature_request.signature_request_id,
          testMode: Boolean(payload.signature_request.test_mode),
        });
      }
      await ctx.runMutation(internal.operations.finishWebhookEvent, {
        eventId: claim.eventId,
        status: outcome ? "PROCESSED" : "IGNORED",
      });
    } catch (error) {
      await ctx.runMutation(internal.operations.finishWebhookEvent, {
        eventId: claim.eventId,
        status: "FAILED",
        error: errorMessage(error),
      });
      return new Response("Processing failed", { status: 500 });
    }

    // Dropbox Sign requires this exact response
    return new Response("Hello API Event Received", { status: 200 });
  }),
});

// ── Resend delivery events ────────────────────────────────────────────────
http.route({
  path: "/webhooks/resend",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    const secret = process.env.RESEND_WEBHOOK_SECRET;
    if (!secret) return new Response("Webhook not configured", { status: 503 });
    let raw: string;
    try {
      raw = await readWebhookBody(req);
    } catch {
      return new Response("Payload too large", { status: 413 });
    }
    const id = req.headers.get("svix-id");
    const timestamp = req.headers.get("svix-timestamp");
    const signatures = req.headers.get("svix-signature");
    if (!id || !timestamp || !signatures)
      return new Response("Missing signature", { status: 401 });
    const unix = Number(timestamp);
    if (!Number.isFinite(unix) || Math.abs(Date.now() / 1000 - unix) > 300)
      return new Response("Expired signature", { status: 401 });
    const expected = await hmacBase64(secret, `${id}.${timestamp}.${raw}`);
    const valid = signatures
      .split(" ")
      .some(
        (part) =>
          part.startsWith("v1,") && constantTimeEqual(part.slice(3), expected),
      );
    if (!valid) return new Response("Invalid signature", { status: 401 });
    const payload = JSON.parse(raw) as {
      type?: string;
      data?: { email_id?: string };
    };
    const claim = await ctx.runMutation(internal.operations.claimWebhookEvent, {
      provider: "RESEND",
      eventId: id,
      eventType: payload.type ?? "unknown",
      reference: payload.data?.email_id,
      payloadDigest: await sha256Hex(raw),
    });
    if (!claim.claimed) return new Response("ok");
    const failed = [
      "email.bounced",
      "email.complained",
      "email.failed",
      "email.suppressed",
    ].includes(payload.type ?? "");
    if (payload.data?.email_id)
      await ctx.runMutation(internal.email.updateDelivery, {
        providerId: payload.data.email_id,
        status: failed ? "FAILED" : "SENT",
      });
    await ctx.runMutation(internal.operations.finishWebhookEvent, {
      eventId: claim.eventId,
      status: payload.data?.email_id ? "PROCESSED" : "IGNORED",
    });
    return new Response("ok");
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

// ── QoreID identity verification webhook ──────────────────────────────────
// QoreID signs the exact raw JSON with HMAC-SHA512 in x-verifyme-signature.
// Store only the workflow reference and normalized outcome; identity payloads
// can contain NIN/BVN and must not be copied into application logs or tables.
http.route({
  path: "/webhooks/qoreid",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    const secret = process.env.QOREID_WEBHOOK_SECRET;
    if (!secret) return new Response("Webhook not configured", { status: 503 });
    let raw = "";
    try {
      raw = await readWebhookBody(req);
    } catch {
      return new Response("Payload too large", { status: 413 });
    }
    const signature = req.headers.get("x-verifyme-signature");
    const expected = await hmacHex("SHA-512", secret, raw);
    if (!signature || !constantTimeEqual(signature.toLowerCase(), expected))
      return new Response("Invalid signature", { status: 401 });

    let payload: {
      id?: string;
      reference?: string;
      status?: string;
      state?: string;
      data?: {
        id?: string;
        reference?: string;
        status?: string;
        state?: string;
      };
    };
    try {
      payload = JSON.parse(raw);
    } catch {
      return new Response("Invalid JSON", { status: 400 });
    }
    const reference = String(
      payload.reference ??
        payload.id ??
        payload.data?.reference ??
        payload.data?.id ??
        "",
    );
    const providerStatus = String(
      payload.status ??
        payload.state ??
        payload.data?.status ??
        payload.data?.state ??
        "unknown",
    ).toLowerCase();
    if (!reference || reference.length > 160)
      return new Response("Missing verification reference", { status: 400 });
    const eventId = `${reference}:${providerStatus}:${await sha256Hex(raw)}`;
    const claim = await ctx.runMutation(internal.operations.claimWebhookEvent, {
      provider: "QOREID",
      eventId,
      eventType: providerStatus,
      reference,
      payloadDigest: await sha256Hex(raw),
    });
    if (!claim.claimed) return new Response("ok");
    const verified = [
      "verified",
      "successful",
      "success",
      "complete",
      "completed",
    ].includes(providerStatus);
    const pending = ["pending", "in_progress", "processing"].includes(
      providerStatus,
    );
    try {
      const result = await ctx.runMutation(internal.kyc.applyQoreIdResult, {
        providerReference: reference,
        providerStatus,
        status: verified ? "VERIFIED" : pending ? "PENDING" : "FAILED",
        failureReason:
          verified || pending
            ? undefined
            : "Identity provider could not verify the submitted record",
      });
      await ctx.runMutation(internal.operations.finishWebhookEvent, {
        eventId: claim.eventId,
        status: result.matched ? "PROCESSED" : "IGNORED",
      });
      return new Response("ok");
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

export default http;
