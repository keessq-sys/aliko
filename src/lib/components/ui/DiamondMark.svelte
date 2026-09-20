<script lang="ts">
  export let size = 24;
  export let animated = true;
</script>

<!--
  Custom faceted-diamond brand mark. Purely declarative SVG animation (no
  JS, works even before hydration): the shimmer sweep is an animated
  gradient stop, so it runs on its own timer independent of any component
  lifecycle.
-->
<svg
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
  class="diamond-mark"
>
  <defs>
    <linearGradient id="diamond-shimmer" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0" />
      <stop offset="50%" stop-color="#ffffff" stop-opacity="0.9" />
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0" />
      {#if animated}
        <animate attributeName="x1" values="-40%;140%" dur="3.2s" repeatCount="indefinite" />
        <animate attributeName="x2" values="60%;240%" dur="3.2s" repeatCount="indefinite" />
      {/if}
    </linearGradient>
  </defs>

  <!-- Crown facets -->
  <path d="M4 9 L9 3 L15 3 L20 9 L12 9 Z" fill="currentColor" fill-opacity="0.95" />
  <path d="M9 3 L12 9 L4 9 Z" fill="currentColor" fill-opacity="0.7" />
  <path d="M15 3 L12 9 L20 9 Z" fill="currentColor" fill-opacity="0.8" />
  <!-- Pavilion facets -->
  <path d="M4 9 L12 21 L8 9.5 Z" fill="currentColor" fill-opacity="0.55" />
  <path d="M20 9 L12 21 L15.5 9.5 Z" fill="currentColor" fill-opacity="0.65" />
  <path d="M4 9 L20 9 L12 21 Z" fill="currentColor" fill-opacity="0.85" />
  <!-- Facet edge lines -->
  <path
    d="M4 9 L9 3 M15 3 L20 9 M9 3 L12 9 M15 3 L12 9 M4 9 L20 9 M4 9 L12 21 M20 9 L12 21"
    stroke="#050A0E"
    stroke-width="0.4"
    stroke-opacity="0.4"
  />
  <!-- Shimmer sweep -->
  <path d="M4 9 L9 3 L15 3 L20 9 L12 21 Z" fill="url(#diamond-shimmer)" />
</svg>

<style>
  .diamond-mark {
    display: block;
  }
</style>
