<script lang="ts">
  import { getTranslation } from "$lib/i18n";
  const adkT = getTranslation();

  import {
    Twitter,
    Linkedin,
    Instagram,
    Youtube,
    Mail,
    MapPin,
    Phone,
    Lamp,
    Cpu,
    Building,
    Hammer,
    DraftingCompass,
    LayoutGrid,
    Building2,
    Landmark,
  } from "lucide-svelte";
  import DiamondMark from "$lib/components/ui/DiamondMark.svelte";
  import { BUSINESS_WHATSAPP_NUMBER, whatsappHref } from "$lib/data/contact";
</script>

<footer
  class="relative mt-24 border-t border-emerald-900/50 bg-stone-900 overflow-hidden"
>
  <!-- Subtle top glow -->
  <div
    class="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-50 shadow-[0_0_20px_rgba(5,150,105,1)]"
  ></div>

  <div class="container mx-auto px-4 lg:px-8 pt-16 pb-8">
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
      <!-- Brand Col -->
      <div class="flex flex-col gap-6 lg:col-span-1">
        <a href="/" class="flex items-center gap-3">
          <div
            class="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-[0_0_15px_rgba(5,150,105,0.4)] text-white"
          >
            <DiamondMark size={18} />
          </div>
          <span
            class="theme-brand-copy text-xl font-serif font-semibold bg-clip-text text-transparent bg-gradient-to-r from-white to-stone-400"
          > {$adkT("Aliko Diamond Key")} </span>
        </a>
        <p class="text-sm text-stone-400 leading-relaxed"> {$adkT("Nigeria's premier real estate, interior design and construction ecosystem. Verified titles, elite agents and turnkey building services.")} </p>
        <div class="flex items-center gap-4">
          <span
            class="p-2 rounded-full bg-white/5 text-stone-500"
            title={$adkT("Social links coming soon")}><Twitter size={18} /></span
          >
          <span
            class="p-2 rounded-full bg-white/5 text-stone-500"
            title={$adkT("Social links coming soon")}><Linkedin size={18} /></span
          >
          <span
            class="p-2 rounded-full bg-white/5 text-stone-500"
            title={$adkT("Social links coming soon")}><Instagram size={18} /></span
          >
          <span
            class="p-2 rounded-full bg-white/5 text-stone-500"
            title={$adkT("Social links coming soon")}><Youtube size={18} /></span
          >
        </div>
      </div>

      <!-- Properties Col -->
      <div class="flex flex-col gap-4">
        <h4 class="text-white font-serif text-lg mb-2">{$adkT("Properties")}</h4>
        <a
          href="/properties"
          class="text-sm text-stone-400 hover:text-white transition-colors"
          >{$adkT("All Listings")}</a
        >
        <a
          href="/properties?type=residential"
          class="text-sm text-stone-400 hover:text-white transition-colors"
          >{$adkT("Residential")}</a
        >
        <a
          href="/properties?type=commercial"
          class="text-sm text-stone-400 hover:text-white transition-colors"
          >{$adkT("Commercial")}</a
        >
        <a
          href="/plots"
          class="text-sm text-stone-400 hover:text-white transition-colors"
          >{$adkT("Land & Plots (Live Registry)")}</a
        >
        <a
          href="/map"
          class="text-sm text-stone-400 hover:text-white transition-colors"
          >{$adkT("Map Search")}</a
        >
      </div>

      <!-- Services Col -->
      <div class="flex flex-col gap-3">
        <h4 class="text-white font-serif text-lg mb-2">{$adkT("Services")}</h4>
        <a
          href="/services/interior-design"
          class="flex items-center gap-2 text-sm text-stone-400 hover:text-emerald-400 transition-colors"
          ><Lamp size={14} /> {$adkT("Interior Design")}</a
        >
        <a
          href="/services/renovation-refurbishment"
          class="flex items-center gap-2 text-sm text-stone-400 hover:text-emerald-400 transition-colors"
          ><Hammer size={14} class="text-emerald-400/80" /> {$adkT("Renovation & Refurbishing")}</a
        >
        <a
          href="/services/architectural-design"
          class="flex items-center gap-2 text-sm text-stone-400 hover:text-emerald-400 transition-colors"
          ><DraftingCompass size={14} class="text-sky-400/80" /> {$adkT("Architectural Design")}</a
        >
        <a
          href="/services/space-planning"
          class="flex items-center gap-2 text-sm text-stone-400 hover:text-emerald-400 transition-colors"
          ><LayoutGrid size={14} class="text-sky-400/80" /> {$adkT("Space Planning")}</a
        >
        <a
          href="/services/smart-home-installation"
          class="flex items-center gap-2 text-sm text-stone-400 hover:text-emerald-400 transition-colors"
          ><Cpu size={14} class="text-purple-400/80" /> {$adkT("Smart Homes")}</a
        >
        <a
          href="/services/construction-services"
          class="flex items-center gap-2 text-sm text-stone-400 hover:text-emerald-400 transition-colors"
          ><Building size={14} class="text-emerald-400/80" /> {$adkT("Construction")}</a
        >
        <a
          href="/services/property-development"
          class="flex items-center gap-2 text-sm text-stone-400 hover:text-emerald-400 transition-colors"
          ><Building2 size={14} class="text-yellow-400/80" /> {$adkT("Property & Facility Mgmt")}</a
        >
        <a
          href="/services/land-real-estate-brokerage"
          class="flex items-center gap-2 text-sm text-stone-400 hover:text-emerald-400 transition-colors"
          ><Landmark size={14} class="text-yellow-400/80" /> {$adkT("Land & Real Estate Brokerage")}</a
        >
        <a
          href="/services"
          class="text-xs font-semibold text-emerald-400 hover:text-emerald-300 mt-1"
          >{$adkT("View all services →")}</a
        >
      </div>

      <!-- Company Col -->
      <div class="flex flex-col gap-4">
        <h4 class="text-white font-serif text-lg mb-2">{$adkT("Company")}</h4>
        <a
          href="/agents"
          class="text-sm text-stone-400 hover:text-white transition-colors"
          >{$adkT("Our Agents")}</a
        >
        <a
          href="/register/agent"
          class="text-sm text-stone-400 hover:text-white transition-colors"
          >{$adkT("Careers — Join as Agent")}</a
        >
        <a
          href="/legal/track"
          class="text-sm text-stone-400 hover:text-white transition-colors"
          >{$adkT("Document Tracking")}</a
        >
        <div class="mt-2 flex flex-col gap-2">
          <a
            href="/register/agent"
            class="btn-primary text-xs py-1.5 w-full text-center"
            >{$adkT("Join as Agent")}</a
          >
          <a
            href="/register/manager"
            class="btn-secondary text-xs py-1.5 w-full text-center"
            >{$adkT("Become a Manager")}</a
          >
        </div>
      </div>

      <!-- Contact/Newsletter Col -->
      <div class="flex flex-col gap-4">
        <h4 class="text-white font-serif text-lg mb-2">{$adkT("Contact & Newsletter")}</h4>
        <div class="flex flex-col gap-2 text-sm text-stone-400">
          <span class="flex items-center gap-2"
            ><MapPin size={16} class="text-emerald-500" /> {$adkT("Abuja FCT & Lagos, Nigeria")}</span
          >
          <a
            href={whatsappHref(
              "Hi, I would like to know more about Aliko Diamond Key.",
            )}
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center gap-2 hover:text-emerald-400 transition-colors"
          >
            <Phone size={16} class="text-emerald-500" />
            {$adkT(BUSINESS_WHATSAPP_NUMBER)} {$adkT("(WhatsApp)")} </a>
          <span class="flex items-center gap-2"
            ><Mail size={16} class="text-emerald-500" /> {$adkT("alikodiamondkey@gmail.com")}</span
          >
        </div>

        <form class="mt-4 flex flex-col gap-2" on:submit|preventDefault>
          <p class="text-xs text-stone-400 mb-1"> {$adkT("Subscribe for exclusive listings")} </p>
          <div class="flex gap-2">
            <input dir="auto"
              type="email"
              inputmode="email"
              autocomplete="email"
              placeholder={$adkT("Email address")}
              class="w-full min-h-[44px] bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-sm text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
              required
            />
            <button
              type="submit"
              aria-label={$adkT("Subscribe")}
              class="btn-primary min-h-[44px] min-w-[44px] px-3 py-2"
              ><Mail size={16} /></button
            >
          </div>
        </form>
      </div>
    </div>

    <!-- Bottom Bar -->
    <div
      class="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4"
    >
      <p class="text-xs text-stone-500">
        &copy; {$adkT(new Date().getFullYear())} {$adkT("Aliko Diamond Key. All rights reserved.")} </p>
      <div class="flex items-center gap-4 text-xs text-stone-500">
        <a href="/legal/terms" class="hover:text-white transition-colors"
          >{$adkT("Terms")}</a
        >
        <a href="/legal/privacy" class="hover:text-white transition-colors"
          >{$adkT("Privacy")}</a
        >
        <a
          href="/legal/payments-refunds"
          class="hover:text-white transition-colors">{$adkT("Payments & Refunds")}</a
        >
        <a href="/legal/track" class="hover:text-white transition-colors"
          >{$adkT("Track a Document")}</a
        >
        <a
          href="/services/general-contracts"
          class="hover:text-white transition-colors">{$adkT("Contract Proposals")}</a
        >
      </div>
      <p class="text-xs font-mono text-stone-400 flex items-center gap-1"> {$adkT("Powered by")} <span class="text-emerald-400">{$adkT("ADK Platform")}</span>
      </p>
    </div>
  </div>
</footer>
