<script lang="ts">
  import { Plus, Minus } from 'lucide-svelte';

  const FAQS = [
    {
      q: 'How does Aliko Diamond Key verify property and land titles?',
      a: 'Every plot and property is cross-checked against CAC company records, AGIS land registry data (for FCT listings) and the relevant State Ministry of Lands before it goes live, and title documents (C of O, Governor\'s Consent, Deed of Assignment) are verified by our legal team ahead of any booking.'
    },
    {
      q: 'Can I bundle a property purchase with interior design or renovation services?',
      a: 'Yes. From any property or land listing you can request a bundled quote that combines the purchase with interior design, furnishing, smart-home installation, renovation or construction — delivered under one contract with one point of contact.'
    },
    {
      q: 'How do diaspora clients buy property remotely?',
      a: 'Diaspora clients get a dedicated onboarding flow, virtual site-visit scheduling, secure remote payments, and document verification with digital signature — you never need to be in Nigeria to complete a purchase.'
    },
    {
      q: 'What payment plans are available?',
      a: 'Most plots and properties support outright payment or installment plans (typically 6 or 12 months), tracked in your client portal with automatic reminders before each due date.'
    },
    {
      q: 'How do I become a verified agent or estate manager on the platform?',
      a: 'Agents apply through a 5-step verification wizard (identity, agency details, coverage area, documents, review); estate management companies apply through a separate enrolment flow reviewed by our admin team before activation.'
    },
    {
      q: 'Does Aliko Diamond Key offer facility and property management services?',
      a: 'Yes — beyond brokerage, our property development and facility management division handles ongoing maintenance, vendor coordination and estate operations for both individual owners and estate managers.'
    }
  ];

  let openIndex: number | null = 0;

  function toggle(i: number) {
    openIndex = openIndex === i ? null : i;
  }
</script>

<section class="border-t border-white/5 bg-[#050A0E] py-20 text-white">
  <div class="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
    <div class="mb-10 text-center">
      <p class="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">FAQ</p>
      <h2 class="font-serif text-3xl font-bold sm:text-4xl">Frequently Asked Questions</h2>
    </div>

    <div class="space-y-3">
      {#each FAQS as item, i}
        <div class="overflow-hidden rounded-2xl border border-white/5 bg-white/[0.03]">
          <button
            type="button"
            on:click={() => toggle(i)}
            class="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
            aria-expanded={openIndex === i}
          >
            <span class="text-sm font-semibold text-white sm:text-base">{item.q}</span>
            <span class="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-white/5 text-emerald-400">
              {#if openIndex === i}<Minus size={14} />{:else}<Plus size={14} />{/if}
            </span>
          </button>
          {#if openIndex === i}
            <div class="px-5 pb-5">
              <p class="text-sm leading-relaxed text-stone-400">{item.a}</p>
            </div>
          {/if}
        </div>
      {/each}
    </div>
  </div>
</section>
