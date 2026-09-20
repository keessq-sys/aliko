<script lang="ts">
  import { TrendingUp, Download, Info } from 'lucide-svelte';

  let investment = 50; // Millions
  let years = 5;
  let growthRate = 12; // Percentage
  let currency: 'NGN' | 'USD' = 'NGN';
  const FX_RATE = 1600;

  $: futureValue = investment * Math.pow((1 + growthRate / 100), years);
  $: profit = futureValue - investment;
  
  $: displayInvestment = currency === 'NGN' ? investment : (investment * 1000000 / FX_RATE).toFixed(0);
  $: displayFutureValue = currency === 'NGN' ? futureValue.toFixed(1) : (futureValue * 1000000 / FX_RATE).toFixed(0);
  $: displayProfit = currency === 'NGN' ? profit.toFixed(1) : (profit * 1000000 / FX_RATE).toFixed(0);
  
  $: symbol = currency === 'NGN' ? '₦' : '$';
  $: suffix = currency === 'NGN' ? 'M' : '';

  $: riskLevel = growthRate < 8 ? 'Low Risk' : growthRate < 15 ? 'Medium Risk' : 'High Risk';
  $: riskColor = growthRate < 8 ? 'text-emerald-400' : growthRate < 15 ? 'text-amber-400' : 'text-rose-400';
</script>

<style>
  .calc-card {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(217, 119, 6, 0.3);
    backdrop-filter: blur(20px);
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  }

  input[type=range] {
    -webkit-appearance: none;
    width: 100%;
    background: transparent;
  }
  input[type=range]::-webkit-slider-thumb {
    -webkit-appearance: none;
    height: 20px;
    width: 20px;
    border-radius: 50%;
    background: #34d399;
    cursor: pointer;
    margin-top: -8px;
    box-shadow: 0 0 10px rgba(52, 211, 153, 0.5);
  }
  input[type=range]::-webkit-slider-runnable-track {
    width: 100%;
    height: 4px;
    cursor: pointer;
    background: rgba(255,255,255,0.1);
    border-radius: 2px;
  }
</style>

<section class="py-24 bg-[#050A0E] text-white">
  <div class="container mx-auto px-6 max-w-6xl">
    
    <div class="text-center mb-16">
      <h2 class="text-3xl md:text-5xl font-extrabold mb-4">Investment ROI Calculator</h2>
      <p class="text-gray-400">Project your returns on Nigerian real estate investments over time.</p>
    </div>

    <div class="calc-card rounded-3xl p-6 md:p-10 grid grid-cols-1 lg:grid-cols-2 gap-12">
      
      <!-- Controls -->
      <div class="space-y-8">
        <div class="flex justify-between items-center bg-white/5 p-2 rounded-xl border border-white/10 w-fit">
          <button class={`px-6 py-2 rounded-lg font-bold text-sm transition-colors ${currency === 'NGN' ? 'bg-emerald-600 text-white' : 'text-gray-400 hover:text-white'}`} on:click={() => currency = 'NGN'}>NGN (₦)</button>
          <button class={`px-6 py-2 rounded-lg font-bold text-sm transition-colors ${currency === 'USD' ? 'bg-emerald-600 text-white' : 'text-gray-400 hover:text-white'}`} on:click={() => currency = 'USD'}>USD ($)</button>
        </div>

        <div>
          <div class="flex justify-between mb-2">
            <label class="font-semibold text-gray-300">Initial Investment</label>
            <span class="font-bold text-amber-400">{symbol}{currency === 'NGN' ? investment : Number(displayInvestment).toLocaleString()}{suffix}</span>
          </div>
          <input type="range" min="10" max="500" step="10" bind:value={investment} />
          <div class="flex justify-between text-xs text-gray-500 mt-1">
            <span>₦10M</span>
            <span>₦500M</span>
          </div>
        </div>

        <div>
          <div class="flex justify-between mb-2">
            <label class="font-semibold text-gray-300">Investment Duration</label>
            <span class="font-bold text-amber-400">{years} Years</span>
          </div>
          <input type="range" min="1" max="20" step="1" bind:value={years} />
        </div>

        <div>
          <div class="flex justify-between mb-2">
            <label class="font-semibold text-gray-300 flex items-center gap-1">Expected Growth Rate <Info size={14} class="text-gray-500"/></label>
            <span class="font-bold text-amber-400">{growthRate}% / year</span>
          </div>
          <input type="range" min="5" max="30" step="1" bind:value={growthRate} />
          <p class={`text-xs mt-2 font-bold ${riskColor}`}>{riskLevel} Projection</p>
        </div>
      </div>

      <!-- Results & Chart -->
      <div class="bg-black/40 rounded-2xl p-6 border border-white/5 flex flex-col">
        <div class="grid grid-cols-2 gap-4 mb-8">
          <div class="p-4 bg-white/5 rounded-xl">
            <p class="text-sm text-gray-400 mb-1">Projected Value</p>
            <p class="text-2xl md:text-3xl font-bold text-emerald-400">{symbol}{currency==='USD'? parseInt(displayFutureValue).toLocaleString() : displayFutureValue}{suffix}</p>
          </div>
          <div class="p-4 bg-white/5 rounded-xl">
            <p class="text-sm text-gray-400 mb-1">Total Profit</p>
            <p class="text-2xl md:text-3xl font-bold text-amber-400">+{symbol}{currency==='USD'? parseInt(displayProfit).toLocaleString() : displayProfit}{suffix}</p>
          </div>
        </div>

        <!-- Fake Chart visualization -->
        <div class="flex-grow flex items-end gap-2 h-40 mb-6">
          {#each Array(years > 10 ? 10 : years) as _, i}
            <div class="flex-1 bg-gradient-to-t from-emerald-900 to-emerald-500 rounded-t-sm transition-all duration-500 relative group"
                 style="height: {30 + (i * (70 / (years > 10 ? 10 : years)))}%;">
              <!-- Tooltip -->
              <div class="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity">
                Yr {i+1}
              </div>
            </div>
          {/each}
        </div>

        <button class="w-full py-4 border border-white/10 hover:bg-white/10 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors mt-auto">
          <Download size={18} /> Download Projection PDF
        </button>
      </div>

    </div>
  </div>
</section>
