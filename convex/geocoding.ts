import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { action, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";

const normalize = (value: string) => value.trim().replace(/\s+/g, " ").toLowerCase();
type GeocodeResult = { addressKey: string; formattedAddress: string; latitude: number; longitude: number; placeId: string };

export const getCached = internalQuery({
  args: { addressKey: v.string() },
  handler: async (ctx, { addressKey }) => {
    const value = await ctx.db.query("geocodeCache").withIndex("by_address", (q) => q.eq("addressKey", addressKey)).unique();
    return value && value.expiresAt > Date.now() ? value : null;
  },
});

export const putCached = internalMutation({
  args: { addressKey: v.string(), formattedAddress: v.string(), latitude: v.number(), longitude: v.number(), placeId: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("geocodeCache").withIndex("by_address", (q) => q.eq("addressKey", args.addressKey)).unique();
    const values = { ...args, expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, createdAt: Date.now() };
    if (existing) { await ctx.db.replace(existing._id, values); return existing._id; }
    return ctx.db.insert("geocodeCache", values);
  },
});

export const geocodeNigeriaAddress = action({
  args: { address: v.string() },
  handler: async (ctx, { address }): Promise<GeocodeResult> => {
    if (!(await getAuthUserId(ctx))) throw new Error("Unauthorized");
    const cleaned = address.trim().replace(/\s+/g, " ");
    if (cleaned.length < 5 || cleaned.length > 250) throw new Error("Address must be between 5 and 250 characters");
    const addressKey = normalize(cleaned);
    const cached: GeocodeResult | null = await ctx.runQuery(internal.geocoding.getCached, { addressKey });
    if (cached) return cached;
    const key = process.env.GOOGLE_MAPS_API_KEY;
    if (!key) throw new Error("Server-side Google Maps geocoding is not configured");
    const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
    url.searchParams.set("address", cleaned); url.searchParams.set("components", "country:NG"); url.searchParams.set("region", "ng"); url.searchParams.set("key", key);
    const response = await fetch(url);
    const body = await response.json() as { status?: string; error_message?: string; results?: Array<{ formatted_address: string; place_id: string; geometry: { location: { lat: number; lng: number } } }> };
    const result = body.results?.[0];
    if (!response.ok || body.status !== "OK" || !result) throw new Error(body.error_message ?? `Geocoding failed: ${body.status ?? response.status}`);
    const value = { addressKey, formattedAddress: result.formatted_address, latitude: result.geometry.location.lat, longitude: result.geometry.location.lng, placeId: result.place_id };
    await ctx.runMutation(internal.geocoding.putCached, value);
    return value;
  },
});
