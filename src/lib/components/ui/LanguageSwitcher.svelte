<script lang="ts">
  import { getI18n, type Locale } from "$lib/i18n";
  import { invalidateAll } from "$app/navigation";
  const { locale } = getI18n();
  function change(event: Event) {
    const next = (event.currentTarget as HTMLSelectElement).value as Locale;
    locale.set(next);
    document.documentElement.lang = next;
    document.documentElement.dir = next === "ar" ? "rtl" : "ltr";
    document.cookie = `adk-language=${next}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
    void invalidateAll();
  }
</script>
<label class="language-switcher">
  <span class="sr-only">Language / اللغة</span>
  <select aria-label="Language / اللغة" value={$locale} on:change={change} dir="auto">
    <option value="en" lang="en">English</option><option value="ar" lang="ar">العربية</option>
  </select>
</label>
<style>
  select { min-height:44px; max-width:112px; border:1px solid #75828a; border-radius:8px; padding:8px; background:var(--surface,#10202b); color:var(--text-main,#f8fafc); font:inherit; }
  :global(html[data-theme="light"]) select { background:#fff; color:#111827; }
</style>
