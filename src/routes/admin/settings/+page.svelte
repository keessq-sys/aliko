<script lang="ts">
  import { Settings, CheckCircle2, Circle, KeyRound, CreditCard, Bot, PenTool, MapPinned, Mail } from "lucide-svelte";

  const INTEGRATIONS = [
    { icon: KeyRound, name: "Google Maps API", env: "PUBLIC_GOOGLE_MAPS_API_KEY", desc: "Interactive property maps across the site", done: false },
    { icon: CreditCard, name: "Paystack Payments", env: "PAYSTACK_SECRET_KEY", desc: "Deposits, instalments & bookings", done: false },
    { icon: Bot, name: "WhatsApp Business", env: "WHATSAPP_ACCESS_TOKEN", desc: "Lead bot & human review queue", done: false },
    { icon: PenTool, name: "Dropbox Sign", env: "DROPBOX_SIGN_API_KEY", desc: "E-signature on legal documents", done: false },
    { icon: MapPinned, name: "QoreID KYC", env: "QOREID_CLIENT_ID", desc: "NIN/BVN identity verification", done: false },
    { icon: Mail, name: "Resend Email", env: "RESEND_API_KEY", desc: "OTP magic links & notification emails", done: false },
  ];
</script>

<svelte:head><title>Settings — ADK Admin</title></svelte:head>

<div class="p-8">
  <div class="mb-6">
    <h1 class="flex items-center gap-2 text-xl font-bold text-white"><Settings class="h-5 w-5 text-stone-300" /> Platform Settings</h1>
    <p class="mt-0.5 text-sm text-stone-500">Deployment secrets are managed with <code class="text-emerald-500">npx convex env set</code> / <code class="text-emerald-500">wrangler secret put</code>.</p>
  </div>

  <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
    {#each INTEGRATIONS as integ}
      <div class="flex items-start gap-4 rounded-2xl p-5" style="background:#0A1628; border: 1px solid rgba(255,255,255,0.06)">
        <div class="rounded-xl bg-white/5 p-3 text-stone-300"><integ.icon size={20} /></div>
        <div class="flex-1">
          <div class="flex items-center gap-2">
            <h2 class="text-sm font-bold text-white">{integ.name}</h2>
            {#if integ.done}
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
