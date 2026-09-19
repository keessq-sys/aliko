<script lang="ts">
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

  const STATUS_COLORS: Record<string, number> = {
    AVAILABLE:         0x059669,
    RESERVED:          0xd97706,
    SOLD:              0xdc2626,
    UNDER_DEVELOPMENT: 0x2563eb,
    OFF_PLAN:          0x7c3aed,
  };

  onMount(async () => {
    const THREE = await import("three");

    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const scene = new THREE.Scene();

    const W = container.clientWidth, H = container.clientHeight;
    const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 200);
    camera.position.set(10, 9, 13);
    camera.lookAt(0, 0, 0);

    renderer.setSize(W, H);

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
      new THREE.MeshStandardMaterial({ color: 0x081a0f, roughness: 0.95 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Roads
    const roadMat = new THREE.MeshStandardMaterial({ color: 0x111a14 });
    [-1.2, 1.2].forEach(x => {
      const r = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.025, 14), roadMat);
      r.position.set(x, 0.012, 0);
      scene.add(r);
    });
    [-1.2, 1.2].forEach(z => {
      const r = new THREE.Mesh(new THREE.BoxGeometry(14, 0.025, 0.2), roadMat);
      r.position.set(0, 0.012, z);
      scene.add(r);
    });

    // Load optional GLTF model
    if (modelUrl) {
      const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader.js");
      const loader = new GLTFLoader();
      loader.load(modelUrl, gltf => {
        scene.add(gltf.scene);
      }, undefined, err => console.warn("[3D] GLTF load error:", err));
    }

    // Plot hotspot meshes
    const meshData: { mesh: import("three").Mesh; base: number; phase: number; status: string }[] = [];
    hotspots.forEach(h => {
      const color = STATUS_COLORS[h.status] ?? 0x475569;
      const height = h.status === "AVAILABLE" ? 0.45 : h.status === "RESERVED" ? 0.7 : 0.22;
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
      mesh.userData = { plotId: h.plotId, beaconNumber: h.beaconNumber, status: h.status };
      scene.add(mesh);
      meshData.push({ mesh, base: height / 2, phase: Math.random() * Math.PI * 2, status: h.status });
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
      return raycaster.intersectObjects(meshData.map(m => m.mesh));
    }

    canvas.addEventListener("mousemove", e => {
      const hits = getIntersects(e);
      const hit = hits[0]?.object as import("three").Mesh | undefined;
      if (hoveredMesh && hoveredMesh !== hit) {
        (hoveredMesh.material as import("three").MeshStandardMaterial).emissiveIntensity = 0.1;
        canvas.style.cursor = "default";
      }
      if (hit?.userData?.plotId) {
        (hit.material as import("three").MeshStandardMaterial).emissiveIntensity = 0.45;
        canvas.style.cursor = "pointer";
        hoveredMesh = hit;
      } else {
        hoveredMesh = null;
      }
    });

    canvas.addEventListener("click", e => {
      const hit = getIntersects(e)[0]?.object;
      if (hit?.userData?.plotId) {
        goto(`/properties/${hit.userData.plotId}`);
      }
    });

    // Animation
    let t = 0;
    function animate() {
      animFrame = requestAnimationFrame(animate);
      t += 0.006;
      camera.position.x = Math.cos(t * 0.12) * 16;
      camera.position.z = Math.sin(t * 0.12) * 16;
      camera.lookAt(0, 0, 0);
      meshData.forEach(({ mesh, base, phase, status }) => {
        if (status === "AVAILABLE") mesh.position.y = base + Math.sin(t * 1.4 + phase) * 0.06;
      });
      renderer.render(scene, camera);
    }
    animate();

    // Resize observer
    const ro = new ResizeObserver(() => {
      const w = container.clientWidth, h = container.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    });
    ro.observe(container);

    return () => ro.disconnect();
  });

  onDestroy(() => {
    cancelAnimationFrame(animFrame);
    renderer?.dispose();
  });
</script>

<div bind:this={container} class="relative w-full h-full rounded-2xl overflow-hidden" style="background:#050A0E">
  <canvas bind:this={canvas} class="w-full h-full block" />

  <!-- Legend -->
  <div class="absolute bottom-4 left-4 flex flex-wrap gap-2">
    {#each [["#059669","Available"],["#d97706","Reserved"],["#dc2626","Sold"],["#2563eb","In Dev"]] as [color, label]}
      <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs text-white/70 font-medium"
           style="background:rgba(0,0,0,0.55);backdrop-filter:blur(8px)">
        <span class="w-2 h-2 rounded-sm" style="background:{color}" />
        {label}
      </div>
    {/each}
  </div>

  <!-- Live indicator -->
  <div class="absolute top-4 right-4 flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full"
       style="background:rgba(0,0,0,0.55);color:#F59E0B;backdrop-filter:blur(8px)">
    <span class="w-1.5 h-1.5 rounded-full bg-emerald-400" style="animation:glowPulse 2s infinite" />
    Live Plot Map
  </div>

  <!-- Hint -->
  <p class="absolute bottom-4 right-4 text-xs text-stone-500 hidden sm:block">
    Click a beacon to view
  </p>
</div>
