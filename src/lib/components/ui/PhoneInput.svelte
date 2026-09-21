<script lang="ts">
  export let value: string = '';
  export let placeholder: string = 'Phone number';
  export let disabled: boolean = false;
  
  function handleInput(e: Event) {
    const target = e.target as HTMLInputElement;
    let val = target.value.replace(/\D/g, '');
    if (val.length > 0) {
      if (!val.startsWith('234')) {
        // Just formatting example, simplified
      }
    }
    value = val;
  }
</script>

<div class="flex w-full min-h-[44px] bg-stone-900 border border-stone-700 rounded-lg overflow-hidden focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500 transition-all">
  <div class="flex items-center px-3 border-r border-stone-700 bg-stone-800 text-stone-300">
    +234
  </div>
  <input
    type="tel"
    inputmode="numeric"
    class="flex-1 bg-transparent px-3 py-2 text-white placeholder-stone-500 outline-none"
    {placeholder}
    {disabled}
    bind:value
    on:input={handleInput}
  />
</div>
