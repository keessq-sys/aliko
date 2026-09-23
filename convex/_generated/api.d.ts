/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as ResendOTPPasswordReset from "../ResendOTPPasswordReset.js";
import type * as aggregates from "../aggregates.js";
import type * as auth from "../auth.js";
import type * as bookings from "../bookings.js";
import type * as crons from "../crons.js";
import type * as enquiries from "../enquiries.js";
import type * as fulfillment from "../fulfillment.js";
import type * as http from "../http.js";
import type * as legalDocuments from "../legalDocuments.js";
import type * as lib_rateLimits from "../lib/rateLimits.js";
import type * as migrations from "../migrations.js";
import type * as milestones from "../milestones.js";
import type * as notifications from "../notifications.js";
import type * as operations from "../operations.js";
import type * as partners from "../partners.js";
import type * as plots from "../plots.js";
import type * as projects from "../projects.js";
import type * as properties from "../properties.js";
import type * as serviceRequests from "../serviceRequests.js";
import type * as services from "../services.js";
import type * as settings from "../settings.js";
import type * as storage from "../storage.js";
import type * as users from "../users.js";
import type * as whatsapp from "../whatsapp.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  ResendOTPPasswordReset: typeof ResendOTPPasswordReset;
  aggregates: typeof aggregates;
  auth: typeof auth;
  bookings: typeof bookings;
  crons: typeof crons;
  enquiries: typeof enquiries;
  fulfillment: typeof fulfillment;
  http: typeof http;
  legalDocuments: typeof legalDocuments;
  "lib/rateLimits": typeof lib_rateLimits;
  migrations: typeof migrations;
  milestones: typeof milestones;
  notifications: typeof notifications;
  operations: typeof operations;
  partners: typeof partners;
  plots: typeof plots;
  projects: typeof projects;
  properties: typeof properties;
  serviceRequests: typeof serviceRequests;
  services: typeof services;
  settings: typeof settings;
  storage: typeof storage;
  users: typeof users;
  whatsapp: typeof whatsapp;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  rateLimiter: import("@convex-dev/rate-limiter/_generated/component.js").ComponentApi<"rateLimiter">;
  workflow: import("@convex-dev/workflow/_generated/component.js").ComponentApi<"workflow">;
  integrationWorkpool: import("@convex-dev/workpool/_generated/component.js").ComponentApi<"integrationWorkpool">;
  migrations: import("@convex-dev/migrations/_generated/component.js").ComponentApi<"migrations">;
  paymentAggregate: import("@convex-dev/aggregate/_generated/component.js").ComponentApi<"paymentAggregate">;
  bookingAggregate: import("@convex-dev/aggregate/_generated/component.js").ComponentApi<"bookingAggregate">;
  serviceRequestAggregate: import("@convex-dev/aggregate/_generated/component.js").ComponentApi<"serviceRequestAggregate">;
};
