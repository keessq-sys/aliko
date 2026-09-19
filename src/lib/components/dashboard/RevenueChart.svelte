<script lang="ts">
  import { onMount } from 'svelte';
  
  export let data: {month: string, revenue: number, expenses: number}[] = [];
  export let type: 'area' | 'bar' = 'area';
  
  let width = 800;
  let height = 300;
  let padding = { top: 20, right: 20, bottom: 30, left: 60 };
  
  $: innerWidth = width - padding.left - padding.right;
  $: innerHeight = height - padding.top - padding.bottom;
  
  $: maxVal = Math.max(...data.map(d => Math.max(d.revenue, d.expenses))) * 1.1; // 10% headroom
  
  // Scales
  $: xScale = (index: number) => padding.left + (index * (innerWidth / (data.length - 1 || 1)));
  $: yScale = (val: number) => padding.top + innerHeight - ((val / maxVal) * innerHeight);
  
  // Area Path Generators
  $: generatePath = (key: 'revenue' | 'expenses') => {
    if (data.length === 0) return '';
    let d = `M ${padding.left} ${yScale(data[0][key])}`;
    for (let i = 1; i < data.length; i++) {
      // Smooth bezier curves
      const x0 = xScale(i - 1);
      const y0 = yScale(data[i - 1][key]);
      const x1 = xScale(i);
      const y1 = yScale(data[i][key]);
      const cpX = x0 + (x1 - x0) / 2;
      
      d += ` C ${cpX} ${y0}, ${cpX} ${y1}, ${x1} ${y1}`;
    }
    return d;
  };
  
  $: generateArea = (key: 'revenue' | 'expenses') => {
    if (data.length === 0) return '';
    let path = generatePath(key);
    path += ` L ${xScale(data.length - 1)} ${padding.top + innerHeight}`;
    path += ` L ${padding.left} ${padding.top + innerHeight} Z`;
    return path;
  };

  // Y-Axis Ticks
  $: yTicks = [0, maxVal * 0.25, maxVal * 0.5, maxVal * 0.75, maxVal];
  
  let mounted = false;
  onMount(() => {
    mounted = true;
  });
</script>

<div class="relative w-full rounded-xl border border-white/5 bg-[#050A0E]/80 p-6 shadow-xl backdrop-blur-md" bind:clientWidth={width}>
  <div class="mb-4 flex items-center justify-between">
    <h3 class="text-lg font-semibold text-white">Financial Overview</h3>
    <div class="flex items-center gap-4 text-sm">
      <div class="flex items-center gap-2">
        <div class="h-3 w-3 rounded-full bg-emerald-500"></div>
        <span class="text-stone-400">Revenue</span>
      </div>
      <div class="flex items-center gap-2">
        <div class="h-3 w-3 rounded-full bg-rose-500"></div>
        <span class="text-stone-400">Expenses</span>
      </div>
    </div>
  </div>
  
  <div class="relative h-[300px] w-full">
    <svg class="h-full w-full overflow-visible">
      <!-- Defs for Gradients -->
      <defs>
        <linearGradient id="revenue-gradient" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stop-color="#059669" stop-opacity="0.3" />
          <stop offset="100%" stop-color="#059669" stop-opacity="0" />
        </linearGradient>
        <linearGradient id="expense-gradient" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stop-color="#e11d48" stop-opacity="0.2" />
          <stop offset="100%" stop-color="#e11d48" stop-opacity="0" />
        </linearGradient>
      </defs>
      
      <!-- Grid Lines -->
      {#each yTicks as tick}
        <line 
          x1={padding.left} 
          y1={yScale(tick)} 
          x2={width - padding.right} 
          y2={yScale(tick)} 
          stroke="rgba(255,255,255,0.05)" 
          stroke-dasharray="4 4"
        />
        <text 
          x={padding.left - 10} 
          y={yScale(tick) + 4} 
          fill="#78716c" 
          font-size="10" 
          text-anchor="end"
        >
          {tick >= 1000000 ? (tick/1000000).toFixed(1) + 'M' : tick}
        </text>
      {/each}
      
      <!-- X Axis Labels -->
      {#each data as d, i}
        <text 
          x={xScale(i)} 
          y={height - 10} 
          fill="#78716c" 
          font-size="12" 
          text-anchor="middle"
        >
          {d.month}
        </text>
      {/each}

      {#if type === 'area'}
        <!-- Areas -->
        <path 
          d={generateArea('revenue')} 
          fill="url(#revenue-gradient)"
          class="transition-opacity duration-1000"
          style="opacity: {mounted ? 1 : 0}"
        />
        <path 
          d={generateArea('expenses')} 
          fill="url(#expense-gradient)"
          class="transition-opacity duration-1000"
          style="opacity: {mounted ? 1 : 0}"
        />
        
        <!-- Lines -->
        <path 
          d={generatePath('revenue')} 
          fill="none" 
          stroke="#059669" 
          stroke-width="3"
          stroke-linecap="round"
          class="drop-shadow-[0_0_8px_rgba(5,150,105,0.4)]"
          style="stroke-dasharray: 2000; stroke-dashoffset: {mounted ? 0 : 2000}; transition: stroke-dashoffset 1.5s ease-out;"
        />
        <path 
          d={generatePath('expenses')} 
          fill="none" 
          stroke="#e11d48" 
          stroke-width="2"
          stroke-linecap="round"
          style="stroke-dasharray: 2000; stroke-dashoffset: {mounted ? 0 : 2000}; transition: stroke-dashoffset 1.5s ease-out 0.2s;"
        />
        
        <!-- Data Points -->
        {#if mounted}
          {#each data as d, i}
            <circle cx={xScale(i)} cy={yScale(d.revenue)} r="4" fill="#050A0E" stroke="#059669" stroke-width="2" class="hover:r-6 transition-all duration-200 cursor-pointer" />
            <circle cx={xScale(i)} cy={yScale(d.expenses)} r="3" fill="#050A0E" stroke="#e11d48" stroke-width="2" class="hover:r-5 transition-all duration-200 cursor-pointer" />
          {/each}
        {/if}
      {:else}
        <!-- Bar Chart -->
        {#each data as d, i}
          {@const barW = (innerWidth / data.length) * 0.3}
          {@const gap = barW * 0.2}
          {@const cx = xScale(i)}
          
          <rect 
            x={cx - barW - gap/2} 
            y={mounted ? yScale(d.revenue) : yScale(0)} 
            width={barW} 
            height={mounted ? (innerHeight + padding.top - yScale(d.revenue)) : 0} 
            fill="#059669" 
            rx="2"
            class="transition-all duration-700 ease-out hover:opacity-80 cursor-pointer"
            style="transition-delay: {i * 50}ms"
          />
          <rect 
            x={cx + gap/2} 
            y={mounted ? yScale(d.expenses) : yScale(0)} 
            width={barW} 
            height={mounted ? (innerHeight + padding.top - yScale(d.expenses)) : 0} 
            fill="#e11d48" 
            rx="2"
            class="transition-all duration-700 ease-out hover:opacity-80 cursor-pointer"
            style="transition-delay: {i * 50 + 100}ms"
          />
        {/each}
      {/if}
    </svg>
  </div>
</div>
