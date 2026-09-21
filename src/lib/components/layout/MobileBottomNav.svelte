<script lang="ts">
  import { Home, Building2, Landmark, Wrench, User } from 'lucide-svelte';
  import { page } from '$app/stores';

  // The 5 most-used sections — same routes as the main header nav.
  const items = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/properties', label: 'Properties', icon: Building2 },
    { href: '/plots', label: 'Plots', icon: Landmark },
    { href: '/services', label: 'Services', icon: Wrench },
    { href: '/dashboard/client', label: 'Account', icon: User }
  ];

  $: isActive = (href: string) => (href === '/' ? $page.url.pathname === '/' : $page.url.pathname.startsWith(href));
</script>

<nav
  class="md:hidden fixed inset-x-0 bottom-0 z-30 flex items-stretch border-t border-white/10 bg-[#050A0E]/95 backdrop-blur-md"
  style="padding-bottom: env(safe-area-inset-bottom, 0px)"
  aria-label="Primary"
>
  {#each items as item}
    {@const active = isActive(item.href)}
    <a
      href={item.href}
      class="flex flex-1 flex-col items-center justify-center gap-0.5 min-h-[56px] py-2 text-[11px] font-medium transition-colors {active ? 'text-emerald-400' : 'text-stone-500'}"
      aria-current={active ? 'page' : undefined}
    >
      <svelte:component this={item.icon} size={20} class={active ? 'text-emerald-400' : 'text-stone-500'} />
      {item.label}
    </a>
  {/each}
</nav>
