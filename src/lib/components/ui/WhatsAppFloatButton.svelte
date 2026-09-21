<script lang="ts">
  import { MessageCircle } from 'lucide-svelte';
  import { whatsappHref } from '$lib/data/contact';

  export let message = "Hi, I'd like to chat with Aliko Diamond Key.";
</script>

<a
  href={whatsappHref(message)}
  target="_blank"
  rel="noopener noreferrer"
  aria-label="Chat with us on WhatsApp"
  class="group fixed bottom-20 right-4 md:bottom-6 md:right-6 z-40 flex items-center gap-3 rounded-full bg-[#25D366] px-4 py-4 text-white shadow-[0_8px_30px_rgba(37,211,102,0.4)] transition-all hover:scale-105 hover:pr-5"
>
  <span class="absolute inset-0 rounded-full bg-[#25D366] opacity-40 motion-safe:animate-ping"></span>
  <MessageCircle size={26} class="relative" />
  <span class="relative max-w-0 overflow-hidden whitespace-nowrap text-sm font-semibold transition-all duration-300 group-hover:max-w-[10rem]">
    Chat with us
  </span>
</a>
