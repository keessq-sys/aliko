<script lang="ts">
  import { getI18n } from "$lib/i18n";
  const { locale: adkLocale } = getI18n();

  import { getTranslation } from "$lib/i18n";
  const adkT = getTranslation();

  import { api } from "$lib/convex/_generated/api";
  import { useQuery } from "$lib/convex/queries";
  import type { Id } from "../../../../convex/_generated/dataModel";
  export let userId: Id<"users"> | undefined = undefined;
  let cursor: string | null = null;
  $: if (userId) cursor = null;
  $: events = useQuery(api.activity.list, { userId, paginationOpts: { cursor, numItems: 30 } });
</script>
<section class="theme-surface theme-text border rounded-xl p-5 mt-6 space-y-3">
  <h2 class="text-xl font-semibold">{$adkT("Account activity")}</h2>
  <p class="text-sm">{$adkT("Sign-ins, registrations, profile changes, messages, identity reviews and reported page visits. Page visits are reported by the browser.")}</p>
  {#if $events === undefined}<p>{$adkT("Loading activity…")}</p>{:else if !$events.page.length}<p>{$adkT("No recorded activity.")}</p>{/if}
  <div class="overflow-x-auto"><table class="w-full text-sm text-start">
    <thead><tr><th class="p-3">{$adkT("Time")}</th><th class="p-3">{$adkT("User")}</th><th class="p-3">{$adkT("Activity")}</th><th class="p-3">{$adkT("Page or record")}</th></tr></thead>
    <tbody>{#each $events?.page ?? [] as event}<tr class="border-t">
      <td class="p-3 whitespace-nowrap">{new Date(event.createdAt).toLocaleString($adkLocale === "ar" ? "ar-NG" : "en-NG")}</td>
      <td class="p-3"><span dir="auto">{event.actorName ?? "System"}</span><bdi class="block text-xs">{event.actorEmail ?? ""}</bdi></td>
      <td class="p-3">{$adkT(event.action).replaceAll("_", " ")}</td><td class="p-3"><bdi>{event.entityId ?? "—"}</bdi></td>
    </tr>{/each}</tbody>
  </table></div>
  <div class="flex gap-3"><button class="btn-ghost" disabled={!cursor} on:click={() => cursor = null}>{$adkT("Latest")}</button>
    <button class="btn-ghost" disabled={!$events || $events.isDone} on:click={() => cursor = $events?.continueCursor ?? null}>{$adkT("Older activity")}</button></div>
</section>
