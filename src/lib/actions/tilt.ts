/**
 * Magnetic 3D tilt-on-hover for cards and images. Pointer position drives
 * rotateX/rotateY around the element's center, with a soft spring back on
 * leave. Respects prefers-reduced-motion.
 * Usage: <a use:tilt> or <a use:tilt={{ max: 10, scale: 1.03 }}>
 */
export function tilt(node: HTMLElement, options: { max?: number; scale?: number; glare?: boolean } = {}) {
  const { max = 7, scale = 1.02, glare = false } = options;

  if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return {};
  }

  node.style.transformStyle = 'preserve-3d';
  node.style.transition = 'transform 0.4s cubic-bezier(0.16,1,0.3,1)';
  node.style.willChange = 'transform';

  let glareEl: HTMLDivElement | null = null;
  if (glare) {
    glareEl = document.createElement('div');
    glareEl.style.cssText =
      'position:absolute;inset:0;pointer-events:none;border-radius:inherit;opacity:0;transition:opacity 0.4s ease;' +
      'background:radial-gradient(circle at var(--gx,50%) var(--gy,50%), rgba(255,255,255,0.18), transparent 60%);z-index:1;';
    const computed = getComputedStyle(node);
    if (computed.position === 'static') node.style.position = 'relative';
    node.appendChild(glareEl);
  }

  function onMove(e: PointerEvent) {
    const rect = node.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    const rx = (-(py - 0.5) * max).toFixed(2);
    const ry = ((px - 0.5) * max).toFixed(2);
    node.style.transition = 'transform 0.08s linear';
    node.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) scale3d(${scale},${scale},${scale})`;
    if (glareEl) {
      glareEl.style.setProperty('--gx', `${px * 100}%`);
      glareEl.style.setProperty('--gy', `${py * 100}%`);
      glareEl.style.opacity = '1';
    }
  }

  function onLeave() {
    node.style.transition = 'transform 0.5s cubic-bezier(0.16,1,0.3,1)';
    node.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)';
    if (glareEl) glareEl.style.opacity = '0';
  }

  node.addEventListener('pointermove', onMove);
  node.addEventListener('pointerleave', onLeave);

  return {
    destroy() {
      node.removeEventListener('pointermove', onMove);
      node.removeEventListener('pointerleave', onLeave);
      glareEl?.remove();
    }
  };
}
