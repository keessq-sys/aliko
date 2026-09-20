<script lang="ts">
  import { Twitter, Linkedin, Instagram, Youtube, Mail, MapPin, Phone, Lamp, Cpu, Building, Hammer, DraftingCompass, LayoutGrid, Building2, Landmark } from 'lucide-svelte';
  import DiamondMark from '$lib/components/ui/DiamondMark.svelte';
  import { BUSINESS_WHATSAPP_NUMBER, whatsappHref } from '$lib/data/contact';
</script>

<footer class="relative mt-24 border-t border-emerald-900/50 bg-stone-900 overflow-hidden">
  <!-- Subtle top glow -->
  <div class="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-50 shadow-[0_0_20px_rgba(5,150,105,1)]"></div>

  <div class="container mx-auto px-4 lg:px-8 pt-16 pb-8">
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">

      <!-- Brand Col -->
      <div class="flex flex-col gap-6 lg:col-span-1">
        <a href="/" class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-[0_0_15px_rgba(5,150,105,0.4)] text-white">
            <DiamondMark size={18} />
          </div>
          <span class="text-xl font-serif font-semibold bg-clip-text text-transparent bg-gradient-to-r from-white to-stone-400">
            Aliko Diamond Key
          </span>
        </a>
        <p class="text-sm text-stone-400 leading-relaxed">
          Nigeria's premier real estate, interior design and construction ecosystem. Verified titles, elite agents and turnkey building services.
        </p>
        <div class="flex items-center gap-4">
          <span class="p-2 rounded-full bg-white/5 text-stone-500" title="Social links coming soon"><Twitter size={18} /></span>
          <span class="p-2 rounded-full bg-white/5 text-stone-500" title="Social links coming soon"><Linkedin size={18} /></span>
          <span class="p-2 rounded-full bg-white/5 text-stone-500" title="Social links coming soon"><Instagram size={18} /></span>
          <span class="p-2 rounded-full bg-white/5 text-stone-500" title="Social links coming soon"><Youtube size={18} /></span>
        </div>
      </div>

      <!-- Properties Col -->
      <div class="flex flex-col gap-4">
        <h4 class="text-white font-serif text-lg mb-2">Properties</h4>
        <a href="/properties" class="text-sm text-stone-400 hover:text-white transition-colors">All Listings</a>
        <a href="/properties?type=residential" class="text-sm text-stone-400 hover:text-white transition-colors">Residential</a>
        <a href="/properties?type=commercial" class="text-sm text-stone-400 hover:text-white transition-colors">Commercial</a>
        <a href="/plots" class="text-sm text-stone-400 hover:text-white transition-colors">Land & Plots (Live Registry)</a>
        <a href="/map" class="text-sm text-stone-400 hover:text-white transition-colors">Map Search</a>
      </div>

      <!-- Services Col -->
      <div class="flex flex-col gap-3">
        <h4 class="text-white font-serif text-lg mb-2">Services</h4>
        <a href="/services/interior-design" class="flex items-center gap-2 text-sm text-stone-400 hover:text-emerald-400 transition-colors"><Lamp size={14} /> Interior Design</a>
        <a href="/services/renovation-refurbishment" class="flex items-center gap-2 text-sm text-stone-400 hover:text-emerald-400 transition-colors"><Hammer size={14} class="text-emerald-400/80" /> Renovation & Refurbishing</a>
        <a href="/services/architectural-design" class="flex items-center gap-2 text-sm text-stone-400 hover:text-emerald-400 transition-colors"><DraftingCompass size={14} class="text-sky-400/80" /> Architectural Design</a>
        <a href="/services/space-planning" class="flex items-center gap-2 text-sm text-stone-400 hover:text-emerald-400 transition-colors"><LayoutGrid size={14} class="text-sky-400/80" /> Space Planning</a>
        <a href="/services/smart-home-installation" class="flex items-center gap-2 text-sm text-stone-400 hover:text-emerald-400 transition-colors"><Cpu size={14} class="text-purple-400/80" /> Smart Homes</a>
        <a href="/services/construction-services" class="flex items-center gap-2 text-sm text-stone-400 hover:text-emerald-400 transition-colors"><Building size={14} class="text-emerald-400/80" /> Construction</a>
        <a href="/services/property-development" class="flex items-center gap-2 text-sm text-stone-400 hover:text-emerald-400 transition-colors"><Building2 size={14} class="text-yellow-400/80" /> Property & Facility Mgmt</a>
        <a href="/services/land-real-estate-brokerage" class="flex items-center gap-2 text-sm text-stone-400 hover:text-emerald-400 transition-colors"><Landmark size={14} class="text-yellow-400/80" /> Land & Real Estate Brokerage</a>
        <a href="/services" class="text-xs font-semibold text-emerald-400 hover:text-emerald-300 mt-1">View all services →</a>
      </div>

      <!-- Company Col -->
      <div class="flex flex-col gap-4">
        <h4 class="text-white font-serif text-lg mb-2">Company</h4>
        <a href="/agents" class="text-sm text-stone-400 hover:text-white transition-colors">Our Agents</a>
        <a href="/register/agent" class="text-sm text-stone-400 hover:text-white transition-colors">Careers — Join as Agent</a>
        <a href="/legal/track" class="text-sm text-stone-400 hover:text-white transition-colors">Document Tracking</a>
        <div class="mt-2 flex flex-col gap-2">
          <a href="/register/agent" class="btn-primary text-xs py-1.5 w-full text-center">Join as Agent</a>
          <a href="/register/manager" class="btn-secondary text-xs py-1.5 w-full text-center">Become a Manager</a>
        </div>
      </div>

      <!-- Contact/Newsletter Col -->
      <div class="flex flex-col gap-4">
        <h4 class="text-white font-serif text-lg mb-2">Contact & Newsletter</h4>
        <div class="flex flex-col gap-2 text-sm text-stone-400">
          <span class="flex items-center gap-2"><MapPin size={16} class="text-emerald-500" /> Abuja FCT & Lagos, Nigeria</span>
          <a href={whatsappHref('Hi, I would like to know more about Aliko Diamond Key.')} target="_blank" rel="noopener noreferrer" class="flex items-center gap-2 hover:text-emerald-400 transition-colors">
            <Phone size={16} class="text-emerald-500" /> {BUSINESS_WHATSAPP_NUMBER} (WhatsApp)
          </a>
          <span class="flex items-center gap-2"><Mail size={16} class="text-emerald-500" /> contact@adk.com</span>
        </div>

        <form class="mt-4 flex flex-col gap-2" on:submit|preventDefault>
          <p class="text-xs text-stone-400 mb-1">Subscribe for exclusive listings</p>
          <div class="flex gap-2">
            <input type="email" placeholder="Email address" class="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-sm text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all" required />
            <button type="submit" class="btn-primary px-3 py-2"><Mail size={16} /></button>
          </div>
        </form>
      </div>

    </div>

    <!-- Bottom Bar -->
    <div class="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
      <p class="text-xs text-stone-500">
        &copy; {new Date().getFullYear()} Aliko Diamond Key. All rights reserved.
      </p>
      <div class="flex items-center gap-4 text-xs text-stone-500">
        <a href="/legal/track" class="hover:text-white transition-colors">Track a Document</a>
        <a href="/services/general-contracts" class="hover:text-white transition-colors">Contract Proposals</a>
      </div>
      <p class="text-xs font-mono text-stone-600 flex items-center gap-1">
        Powered by <span class="text-emerald-500/70">ADK Platform</span>
      </p>
    </div>
  </div>
</footer>
