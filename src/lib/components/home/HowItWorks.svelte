<script lang="ts">
  import { Search, CalendarDays, ShieldCheck, Key } from 'lucide-svelte';
  import { reveal, revealStagger } from '$lib/actions/reveal';

  const steps = [
    {
      id: 1,
      icon: Search,
      title: "Search & Discover",
      desc: "Browse 1,200+ verified listings with advanced filters tailored to your needs.",
      color: "emerald"
    },
    {
      id: 2,
      icon: CalendarDays,
      title: "Schedule a Viewing",
      desc: "Book direct physical or virtual tours with agents in just 2 clicks.",
      color: "amber"
    },
    {
      id: 3,
      icon: ShieldCheck,
      title: "Verify & Secure",
      desc: "Every property comes with government-backed title verification.",
      color: "blue"
    },
    {
      id: 4,
      icon: Key,
      title: "Own Your Property",
      desc: "Sign digitally and get your auto-generated deed in 24 hours.",
      color: "emerald"
    }
  ];
</script>

<style>
  .step-card {
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.05);
    transition: all 0.3s ease;
  }
  
  .step-card:hover {
    transform: translateY(-8px);
    background: rgba(255, 255, 255, 0.04);
  }

  .line-dashed {
    background-image: linear-gradient(90deg, rgba(255,255,255,0.1) 50%, transparent 50%);
    background-size: 16px 2px;
  }
  
  @media (max-width: 1024px) {
    .line-dashed {
      background-image: linear-gradient(180deg, rgba(255,255,255,0.1) 50%, transparent 50%);
      background-size: 2px 16px;
    }
  }
</style>

<section class="py-24 bg-[#050A0E] text-white relative overflow-hidden" use:reveal>
  <div class="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
  
  <div class="container mx-auto px-6 relative z-10">
    <div class="text-center max-w-2xl mx-auto mb-16">
      <h4 class="text-amber-500 font-bold tracking-widest uppercase text-sm mb-2">Simple Process</h4>
      <h2 class="text-3xl md:text-5xl font-extrabold mb-4">Your Journey to Property Ownership</h2>
      <p class="text-gray-400">We've streamlined the Nigerian real estate process to make buying, selling, or renting transparent and stress-free.</p>
    </div>

    <div class="relative">
      <!-- Connecting Line -->
      <div class="absolute top-1/2 left-0 w-full h-[2px] line-dashed hidden lg:block -translate-y-1/2 z-0"></div>
      <div class="absolute left-8 top-0 h-full w-[2px] line-dashed lg:hidden z-0"></div>

      <div class="grid grid-cols-1 lg:grid-cols-4 gap-8 lg:gap-6 relative z-10" use:revealStagger={{ step: 120 }}>
        {#each steps as step}
          <div class="step-card rounded-2xl p-6 relative flex flex-row lg:flex-col items-start lg:items-center text-left lg:text-center gap-6 lg:gap-4 group">
            
            <!-- Number Badge -->
            <div class="absolute -top-3 -right-3 lg:-top-4 lg:right-auto lg:left-1/2 lg:-translate-x-1/2 w-8 h-8 rounded-full bg-[#050A0E] border-2 border-{step.color}-500 text-{step.color}-500 flex items-center justify-center font-bold text-sm shadow-[0_0_15px_rgba(5,150,105,0.3)] group-hover:scale-110 transition-transform">
              {step.id}
            </div>

            <!-- Icon -->
            <div class="w-16 h-16 rounded-2xl bg-{step.color}-500/10 border border-{step.color}-500/20 flex items-center justify-center shrink-0 group-hover:bg-{step.color}-500/20 transition-colors">
              <svelte:component this={step.icon} size={32} class="text-{step.color}-400" />
            </div>

            <!-- Text -->
            <div>
              <h3 class="text-xl font-bold mb-2">{step.title}</h3>
              <p class="text-gray-400 text-sm leading-relaxed">{step.desc}</p>
            </div>
            
          </div>
        {/each}
      </div>
    </div>
  </div>
</section>
