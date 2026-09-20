<script lang="ts">
  import { ShieldCheck, FileText, Lock, Building } from 'lucide-svelte';
  import { reveal } from '$lib/actions/reveal';

  const pillars = [
    { icon: FileText, title: 'C of O & Title Deeds', desc: 'Verified documents directly with land registries.' },
    { icon: Building, title: 'CAC Verified', desc: 'All agencies and developers are registered entities.' },
    { icon: Lock, title: 'Secure Payments', desc: 'Escrow options and encrypted transaction pathways.' },
    { icon: ShieldCheck, title: 'AGIS Registered', desc: 'Compliant with Abuja Geographic Information Systems.' }
  ];
</script>

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
    box-shadow: 0 0 15px #34d399, 0 0 30px #34d399;
    animation: scan 3s ease-in-out infinite alternate;
    opacity: 0.5;
  }

  @keyframes scan {
    0% { left: 0%; }
    100% { left: 100%; }
  }
</style>

<section class="trust-banner py-20 relative overflow-hidden text-white" use:reveal>
  <div class="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSIvPjwvc3ZnPg==')] opacity-20"></div>
  
  <div class="container mx-auto px-6 relative z-10">
    <div class="flex flex-col lg:flex-row gap-12 items-center">
      
      <!-- Left: Big Guarantee -->
      <div class="w-full lg:w-1/3 text-center lg:text-left">
        <div class="inline-block relative p-1 rounded-2xl bg-gradient-to-r from-emerald-400 to-amber-500 mb-6">
          <div class="bg-[#050A0E] px-6 py-3 rounded-xl flex items-center gap-3">
            <ShieldCheck class="text-emerald-400" size={32} />
            <span class="text-xl font-extrabold tracking-wide uppercase">100% Legal Guarantee</span>
          </div>
        </div>
        <h3 class="text-4xl font-extrabold mb-4">Zero Fraud Cases in 15 Years.</h3>
        <p class="text-gray-300">Our multi-layered verification system ensures your investment is completely secure and legally binding.</p>
      </div>

      <!-- Right: Pillars -->
      <div class="w-full lg:w-2/3 grid grid-cols-1 md:grid-cols-2 gap-6 relative">
        <div class="scanner-line hidden md:block"></div>
        
        {#each pillars as pillar}
          <div class="bg-white/5 border border-white/10 rounded-2xl p-6 flex gap-4 items-start relative overflow-hidden group">
            <div class="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
              <svelte:component this={pillar.icon} size={24} class="text-emerald-400" />
            </div>
            <div>
              <h4 class="font-bold text-lg mb-1">{pillar.title}</h4>
              <p class="text-sm text-gray-400">{pillar.desc}</p>
            </div>
          </div>
        {/each}
      </div>

    </div>

    <!-- What we actually check documents against — not a claim of partnership or endorsement -->
    <div class="mt-16 pt-8 border-t border-white/10">
      <p class="text-center text-xs text-gray-500 uppercase tracking-widest mb-6">Every Title Is Cross-Checked Against</p>
      <div class="flex flex-wrap justify-center gap-x-12 gap-y-4 opacity-60">
        <div class="text-sm font-semibold tracking-wide">CAC Company Registry</div>
        <div class="text-sm font-semibold tracking-wide">AGIS Land Records (FCT)</div>
        <div class="text-sm font-semibold tracking-wide">State Ministry of Lands</div>
      </div>
      <p class="mt-6 text-center text-xs text-gray-600">Payments processed securely via Paystack.</p>
    </div>
  </div>
</section>
