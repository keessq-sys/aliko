<script lang="ts">
  export let data;
</script>

<svelte:head>
  <title>{data.policy.title} | Aliko Diamond Key</title>
  <meta name="description" content={data.policy.summary} />
</svelte:head>

<main class="min-h-screen bg-stone-50 px-4 pb-20 pt-32 text-stone-950 dark:bg-stone-950 dark:text-stone-100">
  <article class="mx-auto max-w-3xl rounded-2xl border border-stone-200 bg-white p-6 shadow-sm dark:border-stone-800 dark:bg-stone-900 md:p-10">
    <p class="mb-3 text-sm font-semibold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">Legal & privacy</p>
    <h1 class="font-serif text-4xl font-bold">{data.policy.title}</h1>
    <p class="mt-4 text-lg leading-8 text-stone-700 dark:text-stone-300">{data.policy.summary}</p>
    <p class="mt-3 text-sm text-stone-600 dark:text-stone-400">Effective version: {data.version}</p>
    <div class="mt-10 space-y-10">
      {#each data.policy.sections as section}
        <section>
          <h2 class="font-serif text-2xl font-semibold">{section.heading}</h2>
          {#each section.body as paragraph}
            <p class="mt-4 leading-7 text-stone-800 dark:text-stone-300">{paragraph}</p>
          {/each}
        </section>
      {/each}
    </div>
    <div class="mt-12 border-t border-stone-200 pt-6 text-sm text-stone-700 dark:border-stone-700 dark:text-stone-300">
      Questions or rights requests can be submitted through your account support area or sent to alikodiamondkey@gmail.com.
    </div>
  </article>
</main>
