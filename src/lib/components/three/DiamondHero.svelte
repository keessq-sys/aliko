<script lang="ts">
  import { onMount, onDestroy, tick } from 'svelte';

  /**
   * Decorative hero "diamond key" gem — a lazy-loaded Three.js moment used
   * only for the homepage hero. Skips entirely (falls back to a static CSS
   * glow, always in the DOM so there's no layout shift) under
   * prefers-reduced-motion, on low-memory devices, or without WebGL — this
   * is a brand accent, never load-bearing content.
   */

  let container: HTMLDivElement;
  let canvas: HTMLCanvasElement;
  let capable = false;
  let destroyed = false;

  let renderer: import('three').WebGLRenderer | undefined;
  let raf = 0;
  let io: IntersectionObserver | undefined;
  let ro: ResizeObserver | undefined;
  let disposables: Array<{ dispose: () => void }> = [];

  onMount(() => {
    const reducedMotion =
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const lowMemory = 'deviceMemory' in navigator && (navigator as unknown as { deviceMemory: number }).deviceMemory < 4;
    if (reducedMotion || lowMemory) return;

    let supportsWebGL = false;
    try {
      const test = document.createElement('canvas');
      supportsWebGL = !!(test.getContext('webgl') || test.getContext('experimental-webgl'));
    } catch {
      supportsWebGL = false;
    }
    if (!supportsWebGL) return;

    (async () => {
      const THREE = await import('three');
      capable = true;
      await tick();
      if (destroyed || !canvas || !container) return;

      const rect = container.getBoundingClientRect();
      const width = Math.max(rect.width, 1);
      const height = Math.max(rect.height, 1);

      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
      renderer.setSize(width, height, false);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 100);
      camera.position.set(0, 0, 6);

      const geometry = new THREE.OctahedronGeometry(1.6, 0);
      const material = new THREE.MeshPhysicalMaterial({
        color: 0x0a3324,
        metalness: 0.1,
        roughness: 0.08,
        transmission: 0.85,
        thickness: 1.4,
        ior: 2.4,
        emissive: 0x059669,
        emissiveIntensity: 0.12
      });
      const gem = new THREE.Mesh(geometry, material);

      const edges = new THREE.EdgesGeometry(geometry);
      const wireMaterial = new THREE.LineBasicMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.4 });
      const wire = new THREE.LineSegments(edges, wireMaterial);
      gem.add(wire);
      scene.add(gem);

      const ambient = new THREE.AmbientLight(0xffffff, 0.5);
      const emeraldLight = new THREE.PointLight(0x059669, 4, 20);
      emeraldLight.position.set(-3, 2, 4);
      const goldLight = new THREE.PointLight(0xf59e0b, 2.5, 20);
      goldLight.position.set(3, -2, 3);
      scene.add(ambient, emeraldLight, goldLight);

      disposables = [geometry, material, edges, wireMaterial];

      let visible = true;
      io = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }, { threshold: 0 });
      io.observe(container);

      ro = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (!entry || !renderer) return;
        const w = Math.max(entry.contentRect.width, 1);
        const h = Math.max(entry.contentRect.height, 1);
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      });
      ro.observe(container);

      function animate() {
        raf = requestAnimationFrame(animate);
        if (!visible || !renderer) return;
        gem.rotation.y += 0.004;
        gem.rotation.x += 0.0015;
        renderer.render(scene, camera);
      }
      animate();
    })();
  });

  onDestroy(() => {
    destroyed = true;
    if (typeof cancelAnimationFrame !== 'undefined') cancelAnimationFrame(raf);
    io?.disconnect();
    ro?.disconnect();
    disposables.forEach((d) => d.dispose());
    renderer?.dispose();
  });
</script>

<div bind:this={container} class="relative w-full h-full" aria-hidden="true">
  <!-- Static fallback: always present to avoid layout shift; fades out once the WebGL canvas is capable -->
  <div
    class="absolute inset-0 rounded-full transition-opacity duration-700"
    style="background: radial-gradient(circle at 35% 30%, rgba(52,211,153,0.55), rgba(217,119,6,0.3) 45%, transparent 70%); filter: blur(6px); opacity: {capable ? 0 : 1};"
  ></div>
  {#if capable}
    <canvas bind:this={canvas} class="absolute inset-0 w-full h-full"></canvas>
  {/if}
</div>
