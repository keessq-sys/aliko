# Responsiveness improvements — 19 October 2026

English pages no longer import the Arabic translation catalogue into the shared browser bundle. Arabic requests receive the catalogue through request-local server data; switching languages updates existing subscribers, with independent state for concurrent users. The catalogue source is 251,940 bytes. Translation resources remain available for Arabic server rendering.

Scroll reveals now take 180ms, with child delays capped at 90ms, rather than 600–800ms plus growing delays. Revealed sections no longer retain will-change hints. Touch devices avoid the decorative perspective grid and sticky-header backdrop blur. Property-card photographs use native lazy loading and asynchronous decoding. The primary text font is preloaded.

Newly opened public and workspace menus preload only the code for visible local links. This handles menu links omitted from SvelteKit's initial preload scan. It does not preload privileged data, skip authentication, cache authorization decisions or alter payment behavior.

Validation: production build succeeded; final Svelte check reports zero errors/warnings; 97 backend tests passed, including four request-local translation tests; Chromium reported 134 passed and seven existing skips. The browser suite covers Arabic switching and SSR, mobile navigation, form contrast, normal-motion featured reveals and service routes. The security audit is retained separately as a local artifact because it contains unresolved vulnerabilities and the repository is public.

Before deployment, the production baseline under 4x CPU throttling measured 765ms catalogue navigation and a 33.4ms scroll-frame p95. A separate normal-speed sample measured 575ms service navigation and 250ms menu interaction using Playwright's user-action timing, which includes automation overhead. Network-idle startup is not LCP or field INP. Final timings must be sampled on the deployed release; local/remote timings are not directly comparable. Heavy original logos/city media, authenticated backend latency and external provider journeys remain separate optimization/acceptance work.
