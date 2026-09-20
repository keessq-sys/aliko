/**
 * Store-compatible Convex query/mutation helpers.
 *
 * `convex-svelte` 0.14 replaced its store-based `useQuery` with reactive
 * objects (data/isLoading/isStale). The existing pages consume Convex data
 * through Svelte `$`-prefixed auto-unwrapping, so this module bridges the
 * two: a real `writable` store fed by `ConvexClient.onUpdate`.
 *
 * - `useQuery(api.x.y, args)` → store whose `$value` is the result (or undefined)
 * - `useMutation(api.x.y)`    → async function returning the mutation result
 */
import { writable, type Writable } from 'svelte/store';
import { getConvexClient } from 'convex-svelte';
import type { FunctionReference, FunctionArgs, FunctionReturnType } from 'convex/server';

export function useQuery<Query extends FunctionReference<'query'>>(
  query: Query | null | undefined,
  args: Query extends FunctionReference<'query'> ? FunctionArgs<Query> : never
): Writable<FunctionReturnType<Query> | undefined> {
  const store = writable<FunctionReturnType<Query> | undefined>(undefined);
  if (!query) return store;
  const client = getConvexClient();
  client.onUpdate(
    query,
    args,
    (result) => store.set(result),
    (err) => console.warn('[convex query]', (err as Error).message)
  );
  return store;
}

export async function runMutation<Mutation extends FunctionReference<'mutation'>>(
  mutation: Mutation,
  args: FunctionArgs<Mutation>
): Promise<FunctionReturnType<Mutation>> {
  const client = getConvexClient();
  return await client.mutation(mutation, args);
}
