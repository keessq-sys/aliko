import { preloadCode } from "$app/navigation";

/** Warm only visible navigation modules, never page data or privileged API calls.
 * SvelteKit's initial viewport scan does not see links in a newly opened menu.
 */
export function preloadVisibleRoutes(node: HTMLElement) {
  if (typeof IntersectionObserver === "undefined") return {};
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      observer.unobserve(entry.target);
      const href = (entry.target as HTMLAnchorElement).href;
      const url = new URL(href, location.href);
      if (url.origin === location.origin)
        void preloadCode(url.pathname).catch(() => {});
    }
  });
  node
    .querySelectorAll<HTMLAnchorElement>('a[href^="/"]')
    .forEach((link) => observer.observe(link));
  return {
    destroy() {
      observer.disconnect();
    },
  };
}
