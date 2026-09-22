/**
 * Scroll-triggered entrance animation. Fades + rises an element into place
 * the first time it crosses into the viewport, then stops observing.
 * Usage: <section use:reveal> or <div use:reveal={{ delay: 150 }}>
 */
export function reveal(node: HTMLElement, options: { delay?: number; y?: number; threshold?: number } = {}) {
  const { delay = 0, y = 28, threshold = 0.15 } = options;

  if (typeof IntersectionObserver === 'undefined') return {};
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return {};

  node.style.opacity = '0';
  node.style.transform = `translateY(${y}px)`;
  node.style.transition = `opacity 0.8s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.8s cubic-bezier(0.16,1,0.3,1) ${delay}ms`;
  node.style.willChange = 'opacity, transform';

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          node.style.opacity = '1';
          node.style.transform = 'translateY(0)';
          observer.unobserve(node);
        }
      }
    },
    { threshold, rootMargin: '0px 0px -8% 0px' }
  );
  observer.observe(node);

  return {
    destroy() {
      observer.disconnect();
    }
  };
}

/** Same as `reveal` but staggers children matching a selector by index. */
export function revealStagger(node: HTMLElement, options: { selector?: string; step?: number; y?: number } = {}) {
  const { selector = ':scope > *', step = 80, y = 24 } = options;

  if (typeof IntersectionObserver === 'undefined') return {};
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return {};

  const children = Array.from(node.querySelectorAll<HTMLElement>(selector));
  children.forEach((child, i) => {
    child.style.opacity = '0';
    child.style.transform = `translateY(${y}px)`;
    child.style.transition = `opacity 0.6s cubic-bezier(0.16,1,0.3,1) ${i * step}ms, transform 0.6s cubic-bezier(0.16,1,0.3,1) ${i * step}ms`;
  });

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          children.forEach((child) => {
            child.style.opacity = '1';
            child.style.transform = 'translateY(0)';
          });
          observer.unobserve(node);
        }
      }
    },
    { threshold: 0.1, rootMargin: '0px 0px -8% 0px' }
  );
  observer.observe(node);

  return {
    destroy() {
      observer.disconnect();
    }
  };
}
