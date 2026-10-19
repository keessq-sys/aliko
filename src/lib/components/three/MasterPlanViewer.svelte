<script lang="ts">
  import { getTranslation } from "$lib/i18n";
  const adkT = getTranslation();

  import { onMount, onDestroy } from "svelte";
  import { goto } from "$app/navigation";

  export let hotspots: {
    plotId: string;
    beaconNumber: string;
    sizeSqm: number;
    status: string;
    position: [number, number, number];
  }[] = [];
  export let modelUrl: string | null = null;

  let container: HTMLDivElement;
  let canvas: HTMLCanvasElement;
  let animFrame: number;
  let renderer: import("three").WebGLRenderer;
  let staticMode = false,
    destroyed = false,
    modelError = "",
    modelLoading = false;
  let controls:
    | import("three/examples/jsm/controls/OrbitControls.js").OrbitControls
    | undefined;
  let needsRender = true,
    visible = true;
  let visibilityObserver: IntersectionObserver | undefined;
  let sceneToDispose: import("three").Scene | undefined;
  function disposeScene(scene: import("three").Object3D) {
    scene.traverse((object) => {
      const mesh = object as import("three").Mesh;
      mesh.geometry?.dispose();
      const materials = Array.isArray(mesh.material)
        ? mesh.material
        : [mesh.material];
      for (const material of materials)
        if (material) {
          for (const value of Object.values(material))
            if (value && typeof value === "object" && "isTexture" in value)
              (value as import("three").Texture).dispose();
          material.dispose();
        }
    });
  }

  const STATUS_COLORS: Record<string, number> = {
    AVAILABLE: 0x059669,
    RESERVED: 0xd97706,
    SOLD: 0xdc2626,
    UNDER_DEVELOPMENT: 0x2563eb,
    OFF_PLAN: 0x7c3aed,
  };

  let resizeObs: ResizeObserver | undefined;

  onMount(async () => {
    const reducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      staticMode = true;
      return;
    }
    const THREE = await import("three");
    if (destroyed) return;

    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
      });
    } catch {
      staticMode = true;
      return;
    }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const scene = new THREE.Scene();
    sceneToDispose = scene;

    const W = container.clientWidth,
      H = container.clientHeight;
    const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 200);
    camera.position.set(10, 9, 13);
    camera.lookAt(0, 0, 0);

    renderer.setSize(W, H);
    const { OrbitControls } =
      await import("three/examples/jsm/controls/OrbitControls.js");
    if (destroyed) return;
    controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.minDistance = 2;
    controls.maxDistance = 150;
    if (modelUrl) {
      modelLoading = true;
      void import("three/examples/jsm/loaders/GLTFLoader.js")
        .then(async ({ GLTFLoader }) => {
          const url = new URL(modelUrl!, location.href);
          if (url.protocol !== "https:" && url.origin !== location.origin)
            throw new Error("An HTTPS master plan is required");
          const model = await new GLTFLoader().loadAsync(url.href);
          if (destroyed) {
            disposeScene(model.scene);
            return;
          }
          scene.add(model.scene);
          needsRender = true;
        })
        .catch(() => {
          if (!destroyed)
            modelError =
              "The master-plan model could not be loaded. Plot markers remain available.";
        })
        .finally(() => {
          if (!destroyed) modelLoading = false;
        });
    }

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    const sun = new THREE.DirectionalLight(0xffd700, 1.4);
    sun.position.set(6, 12, 6);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 80;
    sun.shadow.camera.left = -20;
    sun.shadow.camera.right = 20;
    sun.shadow.camera.top = 20;
    sun.shadow.camera.bottom = -20;
    scene.add(sun);
    const fillLight = new THREE.PointLight(0x059669, 0.8, 30);
    fillLight.position.set(-6, 4, -6);
    scene.add(fillLight);

    // Ground
    scene.add(new THREE.GridHelper(14, 14, 0x1a3a2a, 0x112b1a));
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(14, 14),
      new THREE.MeshStandardMaterial({ color: 0x081a0f, roughness: 0.95 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Plot hotspot meshes
    const meshData: {
      mesh: import("three").Mesh;
      base: number;
      phase: number;
      status: string;
    }[] = [];
    hotspots.forEach((h) => {
      const color = STATUS_COLORS[h.status] ?? 0x475569;
      const height =
        h.status === "AVAILABLE" ? 0.45 : h.status === "RESERVED" ? 0.7 : 0.22;
      const geo = new THREE.BoxGeometry(1.85, height, 1.85);
      const mat = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.38,
        metalness: 0.25,
        emissive: color,
        emissiveIntensity: 0.1,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(...h.position);
      mesh.position.y = height / 2;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData = {
        plotId: h.plotId,
        beaconNumber: h.beaconNumber,
        status: h.status,
      };
      scene.add(mesh);
      meshData.push({
        mesh,
        base: height / 2,
        phase: Math.random() * Math.PI * 2,
        status: h.status,
      });
    });

    // Raycasting for click + hover
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let hoveredMesh: import("three").Mesh | null = null;

    function getIntersects(event: MouseEvent): import("three").Intersection[] {
      const rect = canvas.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      return raycaster.intersectObjects(meshData.map((m) => m.mesh));
    }

    canvas.addEventListener("mousemove", (e) => {
      needsRender = true;
      const hits = getIntersects(e);
      const hit = hits[0]?.object as import("three").Mesh | undefined;
      if (hoveredMesh && hoveredMesh !== hit) {
        (
          hoveredMesh.material as import("three").MeshStandardMaterial
        ).emissiveIntensity = 0.1;
        canvas.style.cursor = "default";
      }
      if (hit?.userData?.plotId) {
        (
          hit.material as import("three").MeshStandardMaterial
        ).emissiveIntensity = 0.45;
        canvas.style.cursor = "pointer";
        hoveredMesh = hit;
        needsRender = true;
      } else {
        hoveredMesh = null;
        needsRender = true;
      }
    });

    let pointerStart = { x: 0, y: 0 };
    canvas.addEventListener("pointerdown", (e) => {
      pointerStart = { x: e.clientX, y: e.clientY };
    });
    canvas.addEventListener("click", (e) => {
      if (
        Math.hypot(e.clientX - pointerStart.x, e.clientY - pointerStart.y) > 6
      )
        return;
      const hit = getIntersects(e)[0]?.object;
      if (hit?.userData?.plotId) {
        goto(`/plots?plot=${encodeURIComponent(hit.userData.plotId)}`);
      }
    });

    // Animation
    visibilityObserver = new IntersectionObserver((entries) => {
      visible = entries[0]?.isIntersecting ?? false;
      if (visible) needsRender = true;
    });
    visibilityObserver.observe(container);
    function animate() {
      animFrame = requestAnimationFrame(animate);
      if (destroyed || document.hidden || !visible) return;
      if (controls?.update() || needsRender) {
        renderer.render(scene, camera);
        needsRender = false;
      }
    }
    animate();

    // Resize observer
    const ro = new ResizeObserver(() => {
      const w = container.clientWidth,
        h = container.clientHeight;
      renderer.setSize(w, h);
      needsRender = true;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    });
    ro.observe(container);
    resizeObs = ro;
  });

  onDestroy(() => {
    destroyed = true;
    controls?.dispose();
    visibilityObserver?.disconnect();
    if (sceneToDispose) disposeScene(sceneToDispose);
    // onDestroy fires during SSR teardown too, where onMount never ran and
    // cancelAnimationFrame doesn't exist at all — guard both.
    if (typeof cancelAnimationFrame !== "undefined")
      cancelAnimationFrame(animFrame);
    renderer?.dispose();
    resizeObs?.disconnect();
  });
</script>

<div
  bind:this={container}
  class="relative w-full h-full rounded-2xl overflow-hidden"
  style="background:#050A0E"
>
  {#if modelLoading}<p
      class="absolute top-2 left-2 z-10 rounded bg-black/80 p-2 text-sm text-white"
      role="status"
    >
      Loading master plan…
    </p>{/if}
  {#if modelError}<p
      class="absolute top-2 left-2 z-10 rounded bg-black/80 p-2 text-sm text-white"
      role="status"
    >
      {modelError}
    </p>{/if}
  {#if staticMode}
    <div class="absolute inset-0 overflow-auto px-5 pt-16 pb-16">
      <p class="text-white mb-3">
        {$adkT("Plot list — the 3D plan is unavailable or motion is reduced.")}
      </p>
      <div class="grid grid-cols-2 gap-3">
        {#each hotspots as hotspot}<a
            class="min-h-[44px] border border-white/30 rounded p-3 text-white"
            href={`/plots?plot=${encodeURIComponent(hotspot.plotId)}`}
            >{$adkT(hotspot.beaconNumber)} · {$adkT(
              hotspot.status.replaceAll("_", " "),
            )}</a
          >{/each}
      </div>
    </div>
  {:else}
    <canvas bind:this={canvas} class="w-full h-full block"></canvas>
  {/if}

  <!-- Legend -->
  <div class="absolute bottom-4 left-4 flex flex-wrap gap-2">
    {#each [["#059669", "Available"], ["#d97706", "Reserved"], ["#dc2626", "Sold"], ["#2563eb", "In Dev"]] as [color, label]}
      <div
        class="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs text-white/70 font-medium"
        style="background:rgba(0,0,0,0.55);backdrop-filter:blur(8px)"
      >
        <span class="w-2 h-2 rounded-sm" style="background:{color}"></span>
        {$adkT(label)}
      </div>
    {/each}
  </div>

  <!-- Live indicator -->
  <div
    class="absolute top-4 right-4 flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full"
    style="background:rgba(0,0,0,0.55);color:#F59E0B;backdrop-filter:blur(8px)"
  >
    <span
      class="w-1.5 h-1.5 rounded-full bg-emerald-400"
      style="animation:glowPulse 2s infinite"
    ></span>
    {$adkT("Live plot status · schematic markers")}
  </div>

  <!-- Hint -->
  <p class="absolute bottom-4 right-4 text-xs text-stone-500 hidden sm:block">
    {$adkT("Click a beacon to view")}
  </p>
</div>
