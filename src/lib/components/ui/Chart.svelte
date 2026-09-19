<script lang="ts">
  import { onMount } from 'svelte';

  export let type: 'bar' | 'area' | 'donut' | 'line' = 'bar';
  export let data: { label: string; value: number; color?: string }[] = [];
  export let height: number = 300;
  export let showLegend: boolean = true;

  const defaultColor = '#10b981'; // emerald-500
  let mounted = false;

  onMount(() => {
    mounted = true;
  });

  $: maxValue = Math.max(...data.map(d => d.value), 1);
  
  // Calculate paths for area/line
  $: points = data.map((d, i) => {
    const x = (i / (data.length - 1 || 1)) * 100;
    const y = 100 - (d.value / maxValue) * 100;
    return `${x},${y}`;
  });
  
  $: linePath = `M ${points.join(' L ')}`;
  $: areaPath = `M ${points[0]?.split(',')[0]},100 L ${points.join(' L ')} L ${points[points.length-1]?.split(',')[0]},100 Z`;

  // Donut calculations
  let totalDonut = 0;
  $: {
    totalDonut = data.reduce((acc, d) => acc + d.value, 0);
  }
  
  function getDonutSegment(index: number) {
    const previousTotal = data.slice(0, index).reduce((acc, d) => acc + d.value, 0);
    const startAngle = (previousTotal / totalDonut) * 360;
    const sliceAngle = (data[index].value / totalDonut) * 360;
    const dashArray = `${(sliceAngle / 360) * 100} 100`;
    const dashOffset = `-${(startAngle / 360) * 100}`;
    return { dashArray, dashOffset };
  }
</script>

<div class="w-full relative flex flex-col gap-4" style="height: {height}px;">
  {#if type === 'bar'}
    <div class="flex-1 flex items-end gap-2 h-full w-full">
      {#each data as item, i}
        <div class="flex-1 flex flex-col items-center gap-2 h-full justify-end group relative">
          <!-- Tooltip -->
          <div class="absolute -top-8 bg-stone-800 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 shadow-lg pointer-events-none">
            {item.label}: {item.value}
          </div>
          <!-- Bar -->
          <div 
            class="w-full rounded-t-sm transition-all duration-700 ease-out"
            style="height: {mounted ? (item.value / maxValue) * 100 : 0}%; background-color: {item.color || defaultColor}; opacity: 0.8;"
          ></div>
        </div>
      {/each}
    </div>
  {:else if type === 'area' || type === 'line'}
    <div class="flex-1 w-full h-full relative group">
      <svg class="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {#if type === 'area'}
          <defs>
            <linearGradient id="areaGradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stop-color={defaultColor} stop-opacity="0.3"/>
              <stop offset="100%" stop-color={defaultColor} stop-opacity="0"/>
            </linearGradient>
          </defs>
          <path d={areaPath} fill="url(#areaGradient)" class="transition-all duration-700 {mounted ? 'opacity-100' : 'opacity-0'}"/>
        {/if}
        <path d={linePath} fill="none" stroke={defaultColor} stroke-width="2" class="transition-all duration-700 {mounted ? 'opacity-100' : 'opacity-0'}"/>
      </svg>
    </div>
  {:else if type === 'donut'}
    <div class="flex-1 w-full h-full flex items-center justify-center relative group">
      <svg class="w-full h-full max-h-full" viewBox="0 0 36 36">
        {#each data as item, i}
          {@const { dashArray, dashOffset } = getDonutSegment(i)}
          <circle
            cx="18" cy="18" r="15.91549430918954"
            fill="transparent"
            stroke={item.color || defaultColor}
            stroke-width="3"
            stroke-dasharray={dashArray}
            stroke-dashoffset={dashOffset}
            class="transition-all duration-1000 ease-out origin-center -rotate-90 hover:stroke-width-4 cursor-pointer"
            style="opacity: {mounted ? 1 : 0};"
          >
            <title>{item.label}: {item.value}</title>
          </circle>
        {/each}
      </svg>
      <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span class="text-sm font-medium text-stone-300">{totalDonut}</span>
      </div>
    </div>
  {/if}

  {#if showLegend}
    <div class="flex flex-wrap justify-center gap-4 mt-2">
      {#each data as item}
        <div class="flex items-center gap-2 text-xs text-stone-400">
          <div class="w-3 h-3 rounded-full" style="background-color: {item.color || defaultColor};"></div>
          {item.label}
        </div>
      {/each}
    </div>
  {/if}
</div>
