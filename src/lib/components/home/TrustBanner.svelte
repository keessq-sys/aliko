<script lang="ts">
  import { getTranslation } from "$lib/i18n";
  const adkT = getTranslation();

  import { ShieldCheck, FileText, Lock, Building } from "lucide-svelte";
  import { reveal } from "$lib/actions/reveal";

  const pillars = [
    {
      icon: FileText,
      title: "C of O & Title Deeds",
      desc: "Request supporting title documents and independent registry searches.",
    },
    {
      icon: Building,
      title: "Company Registration",
      desc: "Request CAC registration evidence from the contracting company.",
    },
    {
      icon: Lock,
      title: "Checkout Review",
      desc: "Confirm the amount and recipient on the hosted checkout before paying.",
    },
    {
      icon: ShieldCheck,
      title: "Registry Due Diligence",
      desc: "Request relevant AGIS or state registry records where applicable.",
    },
  ];
</script>

<section
  class="theme-contrast-dark trust-banner py-20 relative overflow-hidden text-white"
  use:reveal
>
  <div
    class="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSIvPjwvc3ZnPg==')] opacity-20"
  ></div>

  <div class="container mx-auto px-6 relative z-10">
    <div class="flex flex-col lg:flex-row gap-12 items-center">
      <!-- Left: Big Guarantee -->
      <div class="w-full lg:w-1/3 text-center lg:text-left">
        <div
          class="inline-block relative p-1 rounded-2xl bg-gradient-to-r from-emerald-400 to-amber-500 mb-6"
        >
          <div
            class="bg-[#050A0E] px-6 py-3 rounded-xl flex items-center gap-3"
          >
            <ShieldCheck class="text-emerald-400" size={32} />
            <span class="text-xl font-extrabold tracking-wide uppercase"
              >{$adkT("Property Due Diligence")}</span
            >
          </div>
        </div>
        <h3 class="text-4xl font-extrabold mb-4">
          {$adkT("Review every property before you commit.")}
        </h3>
        <p class="text-gray-300">
          {$adkT(
            "Ask for supporting documents and independent legal advice. A published listing does not guarantee title, availability or investment returns.",
          )}
        </p>
      </div>

      <!-- Right: Pillars -->
      <div
        class="w-full lg:w-2/3 grid grid-cols-1 md:grid-cols-2 gap-6 relative"
      >
        <div class="scanner-line hidden md:block"></div>

        {#each pillars as pillar}
          <div
            class="bg-white/5 border border-white/10 rounded-2xl p-6 flex gap-4 items-start relative overflow-hidden group"
          >
            <div
              class="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0"
            >
              <svelte:component
                this={pillar.icon}
                size={24}
                class="text-emerald-400"
              />
            </div>
            <div>
              <h4 class="font-bold text-lg mb-1">{$adkT(pillar.title)}</h4>
              <p class="text-sm text-gray-400">{$adkT(pillar.desc)}</p>
            </div>
          </div>
        {/each}
      </div>
    </div>

    <!-- What we actually check documents against — not a claim of partnership or endorsement -->
    <div class="mt-16 pt-8 border-t border-white/10">
      <p
        class="text-center text-xs text-gray-500 uppercase tracking-widest mb-6"
      >
        {$adkT("Records to request for independent checks")}
      </p>
      <div class="flex flex-wrap justify-center gap-x-12 gap-y-4 opacity-60">
        <div class="text-sm font-semibold tracking-wide">
          {$adkT("CAC Company Registry")}
        </div>
        <div class="text-sm font-semibold tracking-wide">
          {$adkT("AGIS Land Records (FCT)")}
        </div>
        <div class="text-sm font-semibold tracking-wide">
          {$adkT("State Ministry of Lands")}
        </div>
      </div>
      <p class="mt-6 text-center text-xs text-gray-600">
        {$adkT(
          "Payments use Korapay hosted checkout. Review the order details before authorising payment.",
        )}
      </p>
    </div>
  </div>
</section>

<style>
  .trust-banner {
    background: linear-gradient(135deg, #064e3b 0%, #050a0e 100%);
    border-top: 1px solid rgba(16, 185, 129, 0.2);
    border-bottom: 1px solid rgba(16, 185, 129, 0.2);
  }

  .scanner-line {
    position: absolute;
    top: 0;
    left: 0;
    width: 2px;
    height: 100%;
    background: #34d399;
    box-shadow:
      0 0 15px #34d399,
      0 0 30px #34d399;
    animation: scan 3s ease-in-out infinite alternate;
    opacity: 0.5;
  }

  @keyframes scan {
    0% {
      left: 0%;
    }
    100% {
      left: 100%;
    }
  }
</style>
