<script lang="ts">
  import { ArrowDown, ArrowUp, Inbox } from 'lucide-svelte';

  type Row = Record<string, any>;
  
  export let columns: {
    key: string;
    label: string;
    sortable?: boolean;
    render?: (val: any, row: Row) => any;
  }[] = [];
  export let rows: Row[] = [];
  export let loading: boolean = false;
  export let emptyMessage: string = "No data found";

  let sortKey: string | null = null;
  let sortDirection: 'asc' | 'desc' = 'asc';

  function handleSort(key: string) {
    const col = columns.find(c => c.key === key);
    if (!col?.sortable) return;

    if (sortKey === key) {
      sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      sortKey = key;
      sortDirection = 'asc';
    }
  }

  $: sortedRows = [...rows].sort((a, b) => {
    if (!sortKey) return 0;
    const valA = a[sortKey];
    const valB = b[sortKey];
    if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
    if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });
</script>

<div class="w-full overflow-x-auto rounded-xl border border-white/10 bg-white/5 backdrop-blur-md">
  <div class="overflow-x-auto">
  <table class="w-full text-left text-sm whitespace-nowrap">
    <thead class="bg-stone-900/50 text-stone-400 border-b border-white/10">
      <tr>
        {#each columns as col}
          <th 
            class="px-6 py-4 font-medium {col.sortable ? 'cursor-pointer hover:text-white transition-colors select-none' : ''} {sortKey === col.key ? 'text-emerald-400' : ''}"
            on:click={() => handleSort(col.key)}
          >
            <div class="flex items-center gap-1.5">
              {col.label}
              {#if col.sortable}
                <div class="flex flex-col text-[10px] leading-[0.5] opacity-50 {sortKey === col.key ? 'opacity-100 text-emerald-400' : ''}">
                  <ArrowUp size={12} class={sortKey === col.key && sortDirection === 'asc' ? 'opacity-100' : 'opacity-30'} />
                  <ArrowDown size={12} class={sortKey === col.key && sortDirection === 'desc' ? 'opacity-100 -mt-1' : 'opacity-30 -mt-1'} />
                </div>
              {/if}
            </div>
          </th>
        {/each}
        {#if $$slots.actions}
          <th class="px-6 py-4 font-medium text-right">Actions</th>
        {/if}
      </tr>
    </thead>
    
    <tbody class="divide-y divide-white/5">
      {#if loading}
        {#each Array(3) as _}
          <tr class="animate-pulse">
            {#each columns as col}
              <td class="px-6 py-4"><div class="h-4 bg-white/10 rounded w-3/4"></div></td>
            {/each}
            {#if $$slots.actions}
              <td class="px-6 py-4"><div class="h-4 bg-white/10 rounded w-8 ml-auto"></div></td>
            {/if}
          </tr>
        {/each}
      {:else if sortedRows.length === 0}
        <tr>
          <td colspan={columns.length + ($$slots.actions ? 1 : 0)} class="px-6 py-12 text-center text-stone-500">
            <div class="flex flex-col items-center gap-2">
              <Inbox size={32} class="opacity-50" />
              <p>{emptyMessage}</p>
            </div>
          </td>
        </tr>
      {:else}
        {#each sortedRows as row}
          <tr class="hover:bg-white/5 transition-colors group">
            {#each columns as col}
              <td class="px-6 py-4 text-stone-300 group-hover:text-white transition-colors">
                {#if col.render}
                  {@html col.render(row[col.key], row)}
                {:else}
                  {row[col.key]}
                {/if}
              </td>
            {/each}
            {#if $$slots.actions}
              <td class="px-6 py-4 text-right">
                <slot name="actions" {row} />
              </td>
            {/if}
          </tr>
        {/each}
      {/if}
    </tbody>
  </table>
  </div>
</div>
