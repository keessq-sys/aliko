<script lang="ts">
  import { Home, Trophy, ArrowRight, CheckCircle2 } from 'lucide-svelte';
</script>

<style>
  .cta-card {
    background: rgba(255, 255, 255, 0.03);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    position: relative;
    overflow: hidden;
    transition: all 0.3s ease;
  }
  
  .cta-card:hover {
    transform: translateY(-5px);
  }
  
  .cta-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    border-radius: inherit;
    padding: 2px;
    background: linear-gradient(135deg, rgba(255,255,255,0.2), transparent);
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
  }

  .glow-emerald {
    box-shadow: 0 0 40px rgba(5, 150, 105, 0.15);
  }
  
  .glow-amber {
    box-shadow: 0 0 40px rgba(217, 119, 6, 0.15);
  }
</style>

<section class="py-24 bg-[#050A0E] text-white">
  <div class="container mx-auto px-6">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
      
      <!-- Buyer Card -->
      <div class="cta-card glow-emerald rounded-3xl p-10 flex flex-col group">
        <div class="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
          <Home class="text-emerald-400" size={32} />
        </div>
        
        <h3 class="text-3xl font-extrabold mb-4">Looking to Buy or Rent?</h3>
        <p class="text-gray-400 mb-8 leading-relaxed">Browse 1,200+ verified properties with our advanced search. Skip the middleman and connect directly with trusted owners.</p>
        
        <ul class="space-y-3 mb-10 text-sm font-medium text-gray-300">
          <li class="flex items-center gap-3"><CheckCircle2 size={18} class="text-emerald-500" /> Government-verified titles</li>
          <li class="flex items-center gap-3"><CheckCircle2 size={18} class="text-emerald-500" /> Schedule physical/virtual viewings</li>
          <li class="flex items-center gap-3"><CheckCircle2 size={18} class="text-emerald-500" /> Track documents via portal</li>
        </ul>
        
        <div class="mt-auto">
          <a href="/properties" class="inline-flex w-full md:w-auto items-center justify-center gap-2 px-8 py-4 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-bold transition-colors">
            Start Searching <ArrowRight size={18} />
          </a>
        </div>
      </div>

      <!-- Agent Card -->
      <div class="cta-card glow-amber rounded-3xl p-10 flex flex-col group">
        <div class="w-16 h-16 rounded-2xl bg-amber-500/20 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
          <Trophy class="text-amber-400" size={32} />
        </div>
        
        <h3 class="text-3xl font-extrabold mb-4">Are You a Professional?</h3>
        <p class="text-gray-400 mb-8 leading-relaxed">Join 86 verified agents generating over ₦2.4B in commissions. Access premium leads and powerful management tools.</p>
        
        <ul class="space-y-3 mb-10 text-sm font-medium text-gray-300">
          <li class="flex items-center gap-3"><CheckCircle2 size={18} class="text-amber-500" /> List unlimited properties</li>
          <li class="flex items-center gap-3"><CheckCircle2 size={18} class="text-amber-500" /> Manage leads in one dashboard</li>
          <li class="flex items-center gap-3"><CheckCircle2 size={18} class="text-amber-500" /> Earn industry-leading commissions</li>
        </ul>
        
        <div class="mt-auto flex flex-col sm:flex-row gap-4">
          <a href="/register/agent" class="inline-flex flex-1 items-center justify-center gap-2 px-8 py-4 bg-amber-600 hover:bg-amber-500 rounded-xl font-bold transition-colors text-white">
            Join as Agent <ArrowRight size={18} />
          </a>
          <a href="/register/manager" class="inline-flex flex-1 items-center justify-center gap-2 px-8 py-4 border border-white/20 hover:bg-white/10 rounded-xl font-bold transition-colors">
            Register Manager
          </a>
        </div>
      </div>

    </div>
  </div>
</section>
