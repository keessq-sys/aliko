/**
 * Store-compatible Convex query/mutation helpers.
 *
 * `convex-svelte` 0.14 replaced its store-based `useQuery` with reactive
 * objects (data/isLoading/isStale). The existing pages consume Convex data
 * through Svelte `$`-prefixed auto-unwrapping, so this module bridges the
 * two: a real `writable` store fed by `ConvexClient.onUpdate`.
 *
 * - `useQuery(api.x.y, args)` â†’ store whose `$value` is the result (or undefined)
 * - `useMutation(api.x.y)`    â†’ async function returning the mutation result
 */
import { writable, type Writable } from "svelte/store";
import { getConvexClient } from "convex-svelte";
import { getFunctionName } from "convex/server";
import { synchronizeSession } from "./session";
import { browser } from "$app/environment";
import type {
  FunctionReference,
  FunctionArgs,
  FunctionReturnType,
} from "convex/server";

export function useQuery<Query extends FunctionReference<"query">>(
  query: Query | null | undefined,
  args: Query extends FunctionReference<"query"> ? FunctionArgs<Query> : never,
): Writable<FunctionReturnType<Query> | undefined> {
  const client = getConvexClient();
  return writable<FunctionReturnType<Query> | undefined>(undefined, (set) => {
    if (!query || !browser) return;
    return client.onUpdate(query, args, set, (error) => {
      console.warn("[convex query]", error.message);
      window.dispatchEvent(
        new CustomEvent("adk-query-error", {
          detail: "Could not load current data. Please refresh or try again.",
        }),
      );
    });
  });
}

export async function runMutation<
  Mutation extends FunctionReference<"mutation">,
>(
  mutation: Mutation,
  args: FunctionArgs<Mutation>,
): Promise<FunctionReturnType<Mutation>> {
  const client = getConvexClient();
  return await client.mutation(mutation, args);
}

export async function runAction<Action extends FunctionReference<"action">>(
  action: Action,
  args: FunctionArgs<Action>,
): Promise<FunctionReturnType<Action>> {
  const client = getConvexClient();
  const name = getFunctionName(action);
  if (name === "auth:signIn" || name === "auth:signOut") {
    const authenticate = async () => {
      const response = await fetch("/api/auth/session", {
        method: name === "auth:signOut" ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: name === "auth:signOut" ? undefined : JSON.stringify(args),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error ?? "Authentication failed");
      if (name === "auth:signOut") {
        client.setAuth(async () => null);
        localStorage.removeItem("adk-role");
      } else if (result.signedIn) {
        await synchronizeSession(client);
      } else if (
        ["signUp", "signIn", "reset-verification"].includes(
          (args as any).params?.flow,
        )
      ) {
        throw new Error("Sign in was not completed. Please try again.");
      }
      localStorage.setItem("adk-session-changed", String(Date.now()));
      return result;
    };
    return navigator.locks
      ? await navigator.locks.request("adk-account-session", authenticate)
      : await authenticate();
  }
  return await client.action(action, args);
}
