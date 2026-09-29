<script lang="ts">
  import { onMount } from 'svelte';
  import { Moon, Sun } from 'lucide-svelte';
  let theme: 'light' | 'dark' = 'dark';

  function apply(next: 'light' | 'dark') {
    theme = next;
    document.documentElement.dataset.theme = next;
    document.documentElement.classList.toggle('dark', next === 'dark');
    document.documentElement.style.colorScheme = next;
    localStorage.setItem('adk-theme', next);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', next === 'dark' ? '#050A0E' : '#F7F5EF');
  }

  function toggle() { apply(theme === 'dark' ? 'light' : 'dark'); }

  onMount(() => {
    const saved = localStorage.getItem('adk-theme');
    const preferred = matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    apply(saved === 'light' || saved === 'dark' ? saved : preferred);
  });
</script>

<button type="button" on:click={toggle} class="theme-toggle inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-white/10 bg-white/5 text-stone-300 transition hover:bg-white/10 hover:text-white" aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} title={`Use ${theme === 'dark' ? 'light' : 'dark'} mode`}>
  {#if theme === 'dark'}<Sun size={19} />{:else}<Moon size={19} />{/if}
</button>
