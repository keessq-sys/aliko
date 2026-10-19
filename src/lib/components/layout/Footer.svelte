<script lang="ts">
  import { api } from "$lib/convex/_generated/api";
  import { runMutation } from "$lib/convex/queries";
  let newsletterEmail = "",
    newsletterConsent = false,
    newsletterBusy = false,
    newsletterMessage = "";
  async function subscribe() {
    if (newsletterBusy) return;
    newsletterBusy = true;
    newsletterMessage = "";
    try {
      await runMutation(api.newsletter.subscribe, {
        email: newsletterEmail,
        consent: newsletterConsent,
      });
      newsletterMessage = "Your subscription has been saved. Thank you.";
    } catch {
      newsletterMessage =
        "Subscription could not be saved. Please check your details and try again.";
    } finally {
      newsletterBusy = false;
    }
  }
  import { getTranslation } from "$lib/i18n";
  const adkT = getTranslation();

  import { Facebook, Instagram, Mail, MapPin, Phone } from "lucide-svelte";
  import DiamondMark from "$lib/components/ui/DiamondMark.svelte";
  import { BUSINESS_EMAIL, whatsappHref } from "$lib/data/contact";
</script>

<footer
  class="relative mt-24 border-t border-emerald-900/50 bg-stone-900 overflow-hidden"
>
  <!-- Subtle top glow -->
  <div
    class="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-50 shadow-[0_0_20px_rgba(5,150,105,1)]"
  ></div>

  <div class="container mx-auto px-4 lg:px-8 pt-16 pb-8">
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-12 mb-16">
      <!-- Brand Col -->
      <div class="flex flex-col gap-6 lg:col-span-1">
        <a href="/" class="flex items-center gap-3">
          <div
            class="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-[0_0_15px_rgba(5,150,105,0.4)] text-white"
          >
            <DiamondMark size={18} />
          </div>
          <span
            class="theme-brand-copy text-xl font-serif font-semibold bg-clip-text text-transparent bg-gradient-to-r from-white to-stone-400"
          >
            {$adkT("Aliko Diamond Key")}
          </span>
        </a>
        <p class="text-sm text-stone-400 leading-relaxed">
          {$adkT(
            "Nigeria's premier real estate, interior design and construction ecosystem. Verified titles, elite agents and turnkey building services.",
          )}
        </p>
        <div class="flex items-center gap-3" aria-label="Social media">
          <a
            href="https://x.com/alikodiamondkey?s=11"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Aliko Diamond Key on X"
            class="social-link"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
              ><path
                d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.64 7.584H.47l8.6-9.835L0 1.154h7.594l5.243 6.932zM17.61 20.644h2.039L6.486 3.24H4.298z"
              /></svg
            >
          </a>
          <a
            href="https://www.instagram.com/invites/contact/?utm_content=d6eqlyb&amp;vrfl=1pgi6tbi52em9"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Aliko Diamond Key on Instagram"
            class="social-link"><Instagram size={18} aria-hidden="true" /></a
          >
          <a
            href="https://www.facebook.com/share/1EkcaGaa3u/?mibextid=wwXIfr"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Aliko Diamond Key on Facebook"
            class="social-link"><Facebook size={18} aria-hidden="true" /></a
          >
          <a
            href="https://www.tiktok.com/@alikodiamondkey?_r=1&amp;_t=ZS-9AfJbKLQSzB"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Aliko Diamond Key on TikTok"
            class="social-link"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
              ><path
                d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.9 2.9 0 1 1-2.5-2.87V9.3a6.36 6.36 0 1 0 5.95 6.37V8.68a8.2 8.2 0 0 0 4.79 1.53V6.79a4.85 4.85 0 0 1-1.02-.1z"
              /></svg
            >
          </a>
        </div>
      </div>

      <!-- Contact/Newsletter Col -->
      <div class="flex flex-col gap-4">
        <h4 class="text-white font-serif text-lg mb-2">
          {$adkT("Contact & Newsletter")}
        </h4>
        <div class="flex flex-col gap-2 text-sm text-stone-400">
          <span class="flex items-center gap-2"
            ><MapPin size={16} class="text-emerald-500" />
            {$adkT("Abuja FCT, Lagos & Kano, Nigeria")}</span
          >
          <a
            href={whatsappHref(
              "Hi, I would like to know more about Aliko Diamond Key.",
            )}
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center gap-2 hover:text-emerald-400 transition-colors"
          >
            <Phone size={16} class="text-emerald-500" />
            09033333909 {$adkT("(WhatsApp)")}
          </a>
          <a
            href={`mailto:${BUSINESS_EMAIL}`}
            class="flex items-center gap-2 hover:text-emerald-400 transition-colors"
            ><Mail size={16} class="text-emerald-500" /> {BUSINESS_EMAIL}</a
          >
        </div>

        <form
          class="mt-4 flex flex-col gap-2"
          on:submit|preventDefault={subscribe}
        >
          <p class="text-xs text-stone-400 mb-1">
            {$adkT("Subscribe for exclusive listings")}
          </p>
          <div class="flex gap-2">
            <input
              dir="auto"
              bind:value={newsletterEmail}
              type="email"
              inputmode="email"
              autocomplete="email"
              placeholder={$adkT("Email address")}
              class="w-full min-h-[44px] bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-sm text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
              required
            />
            <button
              disabled={newsletterBusy}
              type="submit"
              aria-label={$adkT("Subscribe")}
              class="btn-primary min-h-[44px] min-w-[44px] px-3 py-2"
              ><Mail size={16} /></button
            >
          </div>
          <label class="flex items-start gap-2 text-xs text-stone-400"
            ><input
              type="checkbox"
              bind:checked={newsletterConsent}
              required
            />I agree to receive listing emails and can unsubscribe by
            contacting the team.</label
          >
          <p role="status" class="text-sm theme-text">{newsletterMessage}</p>
        </form>
      </div>
    </div>

    <!-- Bottom Bar -->
    <div
      class="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4"
    >
      <p class="text-xs text-stone-500">
        &copy; {$adkT(new Date().getFullYear())}
        {$adkT("Aliko Diamond Key. All rights reserved.")}
      </p>

      <p class="text-xs font-mono text-stone-400 flex items-center gap-1">
        {$adkT("Powered by")}
        <span class="text-emerald-400">{$adkT("ADK Platform")}</span>
      </p>
    </div>
  </div>
</footer>

<style>
  .social-link {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 44px;
    min-height: 44px;
    border-radius: 999px;
    background: rgb(255 255 255 / 0.08);
    color: inherit;
    transition:
      color 150ms,
      background-color 150ms;
  }
  .social-link:hover {
    background: rgb(16 185 129 / 0.2);
  }
  .social-link:focus-visible {
    outline: 2px solid #10b981;
    outline-offset: 3px;
  }
  @media (prefers-reduced-motion: reduce) {
    .social-link {
      transition: none;
    }
  }
</style>
