<script lang="ts">
  import { getTranslation } from "$lib/i18n";
  const adkT = getTranslation();
</script>

<section class="platform-banner" aria-label={$adkT("Your property journey")}>
  <img
    src="/images/services/stock/real-estate-key.jpg"
    alt={$adkT("House key, property models and a calculator")}
    loading="lazy"
    width="480"
    height="320"
  />
  <div>
    <p class="eyebrow">{$adkT("Aliko Diamond Key")}</p>
    <h2>{$adkT("One account. A connected property journey.")}</h2>
    <p>
      {$adkT(
        "Explore listings, request professional services and follow updates in your private workspace.",
      )}
    </p>
    <div class="flex flex-wrap gap-3 mt-4">
      <a href="/properties" class="workspace-action workspace-action-primary"
        >🏠 {$adkT("Browse Properties")}</a
      ><a href="/services" class="workspace-action">🛠️ {$adkT("Services")}</a>
    </div>
  </div>
</section>

<style>
  .platform-banner {
    max-width: 1200px;
    margin: 32px auto 64px;
    display: grid;
    grid-template-columns: 240px minmax(0, 1fr);
    background: var(--surface);
    border: 1px solid var(--border-soft);
    border-radius: 20px;
    overflow: hidden;
    color: var(--text-main);
  }
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    max-height: 300px;
  }
  .platform-banner > div {
    padding: 28px;
  }
  .eyebrow {
    font-size: 12px;
    color: var(--form-success);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }
  h2 {
    font-size: clamp(24px, 3vw, 34px);
    margin: 8px 0;
  }
  p {
    line-height: 1.7;
  }
  .platform-banner a {
    font-family: Inter, sans-serif;
  }
  @media (max-width: 700px) {
    .platform-banner {
      margin: 24px 16px;
      grid-template-columns: minmax(0, 1fr);
    }
    img {
      height: 180px;
    }
    .platform-banner > div {
      padding: 22px;
    }
  }
</style>
