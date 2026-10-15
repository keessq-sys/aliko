<script lang="ts">
  import { getTranslation } from "$lib/i18n";
  import { installPrompt, appInstalled } from "$lib/stores/install";
  const adkT = getTranslation();
  let showInstructions = false,
    busy = false;
  async function install() {
    if (!$installPrompt) {
      showInstructions = !showInstructions;
      return;
    }
    busy = true;
    try {
      await $installPrompt.prompt();
      const choice = await $installPrompt.userChoice;
      if (choice.outcome === "accepted") showInstructions = false;
      installPrompt.set(null);
    } finally {
      busy = false;
    }
  }
</script>

<div class="install-app">
  <button
    type="button"
    class="workspace-action"
    disabled={$appInstalled || busy}
    on:click={install}
    ><span aria-hidden="true">📲</span>{$adkT(
      $appInstalled ? "App installed" : "Get the app",
    )}</button
  >
  {#if showInstructions}<div class="install-instructions" role="status">
      <strong>{$adkT("Install Aliko Diamond Key")}</strong>
      <p>
        {$adkT(
          "On iPhone or iPad, use Safari: Share → Add to Home Screen. On Android or desktop, open your browser menu and choose Install app or Add to Home screen. Availability depends on your browser.",
        )}
      </p>
      <button
        type="button"
        class="underline"
        on:click={() => (showInstructions = false)}>{$adkT("Close")}</button
      >
    </div>{/if}
</div>

<style>
  .install-app {
    padding: 8px;
  }
  .install-instructions {
    padding: 16px;
    margin-top: 12px;
    border: 1px solid var(--workspace-line);
    border-radius: 12px;
    line-height: 1.65;
    font-size: 14px;
  }
  .install-instructions p {
    margin: 8px 0;
    color: var(--text-muted);
  }
</style>
