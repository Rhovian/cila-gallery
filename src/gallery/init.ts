// Gallery initializer.
// Creates the renderer, scene, lights, painting clusters, and camera
// choreography for a given Series. Returns a destroy() handle for SPA cleanup.

import * as THREE from 'three';
import { buildRoom, placeWorks, createSceneResources, disposeSceneResources, ROOM } from './scene';
import { layoutSeries } from './layout';
import { setupCameraChoreography } from './choreography';
import { setSeries } from './state';
import type { Series } from '~/types';

export interface GalleryHandle {
  destroy(): void;
}

export interface InitGalleryOptions {
  canvas: HTMLCanvasElement;
  scrollContainer: HTMLElement;
  series: Series;
  /** Pixels of scroll distance to traverse the entire timeline. Defaults to a per-work figure. */
  scrollDistance?: number;
}

export function initGallery({
  canvas,
  scrollContainer,
  series,
  scrollDistance
}: InitGalleryOptions): GalleryHandle {
  setSeries(series);

  const layout = layoutSeries(series, ROOM.width);
  const distance = scrollDistance ?? Math.round((series.works.length + 2) * 760);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  // Cap DPR — phones report 3x+, which quadruples the fragment load for no
  // visible gain on a scene this soft.
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  // No shadow maps and only a handful of real lights — the spotlight pools,
  // floor spill and ceiling fixtures are faked with additive quads in scene.ts,
  // so the fragment shader stays light enough for mobile.

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x17150f);
  scene.fog = new THREE.Fog(0x17150f, 7, 34);

  // near/far kept tight (fog hides the far end well before 130 m anyway) so the
  // depth buffer keeps enough precision to avoid coplanar flicker down the room.
  const camera = new THREE.PerspectiveCamera(52, 1, 0.2, 130);

  const resources = createSceneResources();
  buildRoom(scene, layout.roomLength, resources);
  const paintingMeshes = placeWorks(scene, series, layout, resources);

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

  const trigger = setupCameraChoreography({ camera, layout, scrollContainer, scrollDistance: distance });

  // Click a painting → glide in to it; click anywhere else (or press Esc, or
  // scroll — handled in choreography) → pull back out.
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const onClick = (e: MouseEvent) => {
    const rect = canvas.getBoundingClientRect();
    ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    ndc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(ndc, camera);
    const hit = raycaster.intersectObjects(paintingMeshes, false)[0];
    if (hit) trigger.focusOn(hit.object as THREE.Mesh);
    else trigger.clearFocus();
  };
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') trigger.clearFocus();
  };
  canvas.addEventListener('click', onClick);
  window.addEventListener('keydown', onKeyDown);

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
      canvas.removeEventListener('click', onClick);
      window.removeEventListener('keydown', onKeyDown);
      ro.disconnect();
      trigger.kill();
      scene.traverse((obj) => {
        if (!(obj instanceof THREE.Mesh)) return;
        obj.geometry.dispose();
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        for (const m of mats) {
          const tex = (m as THREE.MeshBasicMaterial).map;
          if (tex) tex.dispose();
          m.dispose();
        }
      });
      disposeSceneResources(resources);
      renderer.dispose();
    }
  };
}
