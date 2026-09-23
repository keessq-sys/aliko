<script lang="ts">
  import { useQuery } from "$lib/convex/queries";
  import { api } from "$lib/convex/_generated/api";
  import { Settings, CheckCircle2, Circle, KeyRound, CreditCard, Bot, PenTool, MapPinned, Mail, Loader2 } from "lucide-svelte";

  const status = useQuery(api.settings.getIntegrationStatus, {});

  // Google Maps is a SvelteKit/Vite PUBLIC_ env var (client-exposed by
  // design), unlike the rest which are Convex-side secrets checked via the
  // getIntegrationStatus query above — never send a real secret value to
  // the client, only a boolean "is it configured" per integration.
  const googleMapsConfigured = Boolean(
    (import.meta.env.PUBLIC_GOOGLE_MAPS_API_KEY as string | undefined)?.trim()
  );

  $: INTEGRATIONS = [
    { icon: KeyRound, name: "Google Maps API", env: "PUBLIC_GOOGLE_MAPS_API_KEY", desc: "Interactive property maps across the site", done: googleMapsConfigured },
    { icon: CreditCard, name: "Paystack Payments", env: "PAYSTACK_SECRET_KEY", desc: "Deposits, instalments & bookings", done: $status?.paystack ?? false },
    { icon: CreditCard, name: "Flutterwave Payments", env: "FLUTTERWAVE_SECRET_KEY + FLUTTERWAVE_SECRET_HASH", desc: "Hosted checkout, transaction verification and payment webhooks", done: $status?.flutterwave ?? false },
    { icon: Bot, name: "WhatsApp Business", env: "WHATSAPP_ACCESS_TOKEN + WHATSAPP_APP_SECRET", desc: "Signed inbound messages, lead bot & human review queue", done: $status?.whatsapp ?? false },
    { icon: PenTool, name: "Dropbox Sign", env: "DROPBOX_SIGN_API_KEY", desc: "E-signature on legal documents", done: $status?.dropboxSign ?? false },
    { icon: MapPinned, name: "QoreID KYC", env: "QOREID_CLIENT_ID", desc: "NIN/BVN identity verification", done: $status?.qoreId ?? false },
    { icon: Mail, name: "Resend Email", env: "RESEND_API_KEY", desc: "Password-reset & notification emails", done: $status?.resend ?? false }
  ];

  $: connectedCount = INTEGRATIONS.filter((i) => i.done).length;
</script>

<svelte:head><title>Settings — ADK Admin</title></svelte:head>

<div class="p-8">
  <div class="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
    <div>
      <h1 class="flex items-center gap-2 text-xl font-bold text-white"><Settings class="h-5 w-5 text-stone-300" /> Platform Settings</h1>
      <p class="mt-0.5 text-sm text-stone-500">Deployment secrets are managed with <code class="text-emerald-500">npx convex env set</code> / <code class="text-emerald-500">wrangler secret put</code> — this page only reports whether each is set, never the value.</p>
    </div>
    <div class="flex-shrink-0 rounded-xl px-4 py-2.5 text-center" style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06)">
      {#if $status === undefined}
        <Loader2 class="mx-auto h-5 w-5 animate-spin text-stone-500" />
      {:else}
        <p class="text-lg font-black text-white">{connectedCount} / {INTEGRATIONS.length}</p>
        <p class="text-xs text-stone-500">Integrations connected</p>
      {/if}
    </div>
  </div>
  <div class="mb-6 h-1.5 overflow-hidden rounded-full bg-white/5">
    <div class="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all" style="width: {$status === undefined ? 0 : (connectedCount / INTEGRATIONS.length) * 100}%"></div>
  </div>

  <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
    {#each INTEGRATIONS as integ}
      <div class="flex items-start gap-4 rounded-2xl p-5" style="background:#0A1628; border: 1px solid rgba(255,255,255,0.06)">
        <div class="rounded-xl bg-white/5 p-3 text-stone-300"><integ.icon size={20} /></div>
        <div class="flex-1">
          <div class="flex items-center gap-2">
            <h2 class="text-sm font-bold text-white">{integ.name}</h2>
            {#if $status === undefined}
              <Loader2 size={14} class="animate-spin text-stone-600" />
            {:else if integ.done}
              <CheckCircle2 size={14} class="text-emerald-400" />
            {:else}
              <Circle size={14} class="text-stone-600" />
            {/if}
          </div>
          <p class="mt-0.5 text-xs text-stone-500">{integ.desc}</p>
          <p class="mt-2 font-mono text-[11px] text-amber-500/80">{integ.env}</p>
        </div>
      </div>
    {/each}
  </div>
</div>
