<svg
  width="104"
  height="104"
  viewBox="0 0 104 104"
  fill="none"
  aria-hidden="true"
  class="workspace-emblem"
>
  <rect
    x="5"
    y="5"
    width="94"
    height="94"
    rx="28"
    fill="var(--workspace-tint)"
  />
  <path
    class="emblem-stroke"
    d="M27 34 38 23h28l11 11-25 30-25-30Z M27 34h50 M38 23l14 41 14-41"
    stroke="var(--workspace-accent)"
    stroke-width="2"
    stroke-linejoin="round"
  />
  <path
    class="emblem-stroke"
    d="M52 64v18m0-6h10m-10 6h6"
    stroke="var(--workspace-accent)"
    stroke-width="3"
    stroke-linecap="round"
  />
</svg>

<style>
  .workspace-emblem {
    flex-shrink: 0;
  }
  .emblem-stroke {
    stroke-dasharray: 240;
    stroke-dashoffset: 0;
    animation: draw-key 850ms ease-out both;
  }
  @keyframes draw-key {
    from {
      stroke-dashoffset: 240;
    }
    to {
      stroke-dashoffset: 0;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .emblem-stroke {
      animation: none;
    }
  }
</style>
