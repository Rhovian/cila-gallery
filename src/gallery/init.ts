// Gallery initializer.
// Creates the renderer, scene, camera, lights, paintings, and choreography
// for a given Series. Returns a destroy() handle for SPA-style cleanup.

import * as THREE from 'three';
import { buildRoom, placePaintings, type PaintingMesh } from './scene';
import { setupCameraChoreography, type ChoreographyTrigger } from './choreography';
import { setSeries, focusPainting } from './state';
import type { Series } from '~/types';

export interface GalleryHandle {
  destroy(): void;
}

export interface InitGalleryOptions {
  canvas: HTMLCanvasElement;
  scrollContainer: HTMLElement;
  series: Series;
  /** Pixels of scroll distance to traverse the entire timeline. */
  scrollDistance?: number;
}

export function initGallery({
  canvas,
  scrollContainer,
  series,
  scrollDistance = 5000
}: InitGalleryOptions): GalleryHandle {
  setSeries(series);

  // Renderer with proper color management.
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;

  // Scene with warm fog so the far end of the room recedes naturally.
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1a1815);
  scene.fog = new THREE.Fog(0x1a1815, 8, 35);

  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
  camera.position.set(0, 1.6, 0);

  buildRoom(scene);
  const paintingMeshes = placePaintings(scene, series);

  // Resize handling — canvas fills its parent.
  const resize = () => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (w === 0 || h === 0) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);

  // Camera choreography (GSAP timeline + ScrollTrigger).
  const trigger = setupCameraChoreography({
    camera,
    series,
    scrollContainer,
    scrollDistance
  }) as ChoreographyTrigger;

  // Click-to-focus via raycasting.
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  const handleClick = (e: MouseEvent) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObjects<PaintingMesh>(paintingMeshes);
    if (hits.length > 0 && hits[0]) {
      focusPainting(hits[0].object.userData.painting);
    }
  };
  canvas.addEventListener('click', handleClick);

  // Render loop.
  let rafId = 0;
  const tick = () => {
    trigger.applyToCamera();
    renderer.render(scene, camera);
    rafId = requestAnimationFrame(tick);
  };
  tick();

  return {
    destroy() {
      cancelAnimationFrame(rafId);
      canvas.removeEventListener('click', handleClick);
      ro.disconnect();
      trigger.kill();
      renderer.dispose();
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry?.dispose();
          if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
          else obj.material?.dispose();
        }
      });
    }
  };
}
