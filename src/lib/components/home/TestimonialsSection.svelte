<script lang="ts">
  import { onMount } from 'svelte';
  import { Star, Quote, ChevronLeft, ChevronRight } from 'lucide-svelte';

  const testimonials = [
    {
      id: 1,
      quote: "Found my dream home in Maitama in just 2 weeks. The verification process gave me complete peace of mind, knowing I was dealing with legitimate title deeds.",
      author: "Chinwe A.",
      location: "Lagos State",
      tag: "Bought a Duplex",
      avatar: "https://picsum.photos/seed/test1/100/100"
    },
    {
      id: 2,
      quote: "As a diaspora investor, this platform made it incredibly easy. I was able to take a virtual tour, verify documents through their portal, and secure a property seamlessly.",
      author: "Dr. Emeka N.",
      location: "United Kingdom",
      tag: "Invested in Land",
      avatar: "https://picsum.photos/seed/test2/100/100"
    },
    {
      id: 3,
      quote: "The ROI calculator helped me visualize my investment. I bought a commercial space in Victoria Island and it's already appreciating faster than projected.",
      author: "Biodun O.",
      location: "Abuja",
      tag: "Commercial Buyer",
      avatar: "https://picsum.photos/seed/test3/100/100"
    }
  ];

  let currentIndex = 0;
  let timer: ReturnType<typeof setInterval>;

  const next = () => currentIndex = (currentIndex + 1) % testimonials.length;
  const prev = () => currentIndex = (currentIndex - 1 + testimonials.length) % testimonials.length;

  onMount(() => {
    timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  });
</script>

<style>
  .test-card {
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(20px);
  }
</style>

<section class="py-24 bg-[#050A0E] text-white overflow-hidden relative">
  <!-- Decorative background elements -->
  <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-600/5 rounded-full blur-3xl pointer-events-none"></div>

  <div class="container mx-auto px-6 relative z-10">
    <div class="text-center mb-16">
      <h2 class="text-3xl md:text-5xl font-extrabold mb-4">What Our Clients Say</h2>
      <p class="text-gray-400">Join thousands of satisfied home owners and investors.</p>
    </div>

    <div class="max-w-4xl mx-auto relative">
      
      <!-- Carousel Container -->
      <div class="overflow-hidden rounded-3xl" on:mouseenter={() => clearInterval(timer)} on:mouseleave={() => timer = setInterval(next, 5000)}>
        <div class="flex transition-transform duration-500 ease-in-out" style="transform: translateX(-{currentIndex * 100}%);">
          {#each testimonials as item}
            <div class="w-full shrink-0 p-4 md:p-8">
              <div class="test-card rounded-3xl p-8 md:p-12 relative">
                <Quote size={64} class="absolute top-8 right-8 text-white/5" />
                
                <div class="flex gap-1 mb-6">
                  {#each Array(5) as _}
                    <Star size={20} class="text-amber-400 fill-amber-400" />
                  {/each}
                </div>
                
                <p class="text-xl md:text-2xl font-medium leading-relaxed mb-10 text-gray-200">"{item.quote}"</p>
                
                <div class="flex items-center gap-4">
                  <img src={item.avatar} alt={item.author} class="w-14 h-14 rounded-full border-2 border-emerald-500/50" />
                  <div>
                    <h4 class="font-bold text-lg">{item.author}</h4>
                    <p class="text-sm text-gray-400">{item.location} • <span class="text-emerald-400">{item.tag}</span></p>
                  </div>
                </div>
              </div>
            </div>
          {/each}
        </div>
      </div>

      <!-- Controls -->
      <div class="flex justify-center items-center gap-6 mt-8">
        <button on:click={prev} class="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
          <ChevronLeft size={24} />
        </button>
        <div class="flex gap-2">
          {#each testimonials as _, i}
            <button on:click={() => currentIndex = i} class={`h-2 rounded-full transition-all ${currentIndex === i ? 'w-8 bg-emerald-500' : 'w-2 bg-white/20'}`}></button>
          {/each}
        </div>
        <button on:click={next} class="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
          <ChevronRight size={24} />
        </button>
      </div>

    </div>
  </div>
</section>
