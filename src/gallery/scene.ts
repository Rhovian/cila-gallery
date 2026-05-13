// Three.js scene construction.
//
// Builds the room shell (floor, ceiling, walls), a deliberately tiny lighting
// rig, and one cluster of framed painting planes per Work, positioned from the
// precomputed SeriesLayout.
//
// Performance note: this scene is *static* (only the camera moves) and has to
// run on phones, so we do not light it with dozens of real spotlights. Instead:
//   • room surfaces use the cheap MeshLambertMaterial (no PBR maths);
//   • paintings use MeshBasicMaterial — unlit, so they render at full speed and
//     show their own true colours and values (you don't want a 3D light gradient
//     smeared across a painting anyway);
//   • the "spotlight wash" on each piece, the spill on the floor, and the
//     ceiling fixtures are all just additive textured quads — pure overdraw, no
//     lighting cost.
// Total real lights: one hemisphere + two directionals.

import * as THREE from 'three';
import type { Series, Work } from '~/types';
import { ART_CENTER_Y, type SeriesLayout, type WorkLayout } from './layout';

export const ROOM = {
  /** Corridor width (x). Paintings hang on the walls at ±width/2. */
  width: 6,
  /** Ceiling height (y). */
  height: 4
} as const;

const WALL_OFFSET = 0.05;            // painting plane's distance off the wall (m); sits just proud of the frame
const FRAME_BORDER = 0.05;           // frame border around a panel (m)
const FRAME_DEPTH = 0.045;           // how far the frame box protrudes from the wall (m)
const CEILING_FIXTURE_SPACING = 6.5; // distance between ceiling light fixtures along the corridor (m)
const PLAQUE_Y = 1.18;               // hanging height of the wall placard (m)
const WALL_GLOW_RISE = 0.22;         // how far above a panel's centre its light pool peaks (m)

// ---- procedural textures (built once, reused) -----------------------------

/** Pale warm hardwood for the floor — tiled across the room. */
function makeFloorTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas context unavailable');

  ctx.fillStyle = '#b9a079';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const plankW = canvas.width / 4;
  for (let i = 0; i < 4; i++) {
    const x = i * plankW;

    const t = (Math.random() - 0.5) * 0.18;
    ctx.fillStyle = t >= 0 ? `rgba(255,245,225,${t})` : `rgba(58,40,22,${-t})`;
    ctx.fillRect(x, 0, plankW, canvas.height);

    for (let g = 0; g < 14; g++) {
      const gx = x + Math.random() * plankW;
      ctx.strokeStyle = `rgba(70,48,26,${0.03 + Math.random() * 0.05})`;
      ctx.lineWidth = 0.6 + Math.random() * 1.8;
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      for (let y = 0; y <= canvas.height; y += 32) {
        ctx.lineTo(gx + Math.sin(y * 0.045 + i * 1.7 + g) * 2.4, y);
      }
      ctx.stroke();
    }

    ctx.fillStyle = 'rgba(35,24,12,0.55)';
    ctx.fillRect(x, 0, 1.5, canvas.height);
  }
  ctx.fillStyle = 'rgba(35,24,12,0.5)';
  ctx.fillRect(0, canvas.height * 0.34, plankW * 2, 2);
  ctx.fillRect(plankW * 2, canvas.height * 0.68, plankW * 2, 2);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Soft warm radial gradient — the building block for every faked light pool. */
function makeGlowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas context unavailable');

  const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, 'rgba(255,243,222,1)');
  g.addColorStop(0.4, 'rgba(255,238,210,0.5)');
  g.addColorStop(1, 'rgba(255,235,205,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function loadPaintingTexture(seriesId: string, file: string): THREE.Texture {
  const tex = new THREE.TextureLoader().load(`/paintings/${seriesId}/${file}`);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/** Small wall placard texture: title, year · medium, dimensions, panel count. */
function makePlaqueTexture(work: Work): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 288;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas context unavailable');

  // A clean off-white card — a touch lighter and cooler than the warm wall, the
  // way museum placards usually read. (Lambert material below, so it's lit like
  // the wall rather than glowing.)
  ctx.fillStyle = '#f5f2ea';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const maxW = canvas.width - 52;
  ctx.fillStyle = '#231d15';
  ctx.font = 'italic 34px Georgia, "Times New Roman", serif';
  ctx.fillText(work.title, 26, 58, maxW);

  ctx.fillStyle = '#6c6358';
  ctx.font = '20px Helvetica, Arial, sans-serif';
  let y = 104;
  const credit = [work.year, work.medium].filter(Boolean).join('   ·   ');
  if (credit) { ctx.fillText(credit, 26, y, maxW); y += 30; }
  if (work.dimensions) { ctx.fillText(work.dimensions, 26, y, maxW); y += 30; }
  if (work.images.length > 1) ctx.fillText(`${work.images.length} panels`, 26, y, maxW);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// ---- shared resources -----------------------------------------------------
// One geometry / material instance reused for every quad of a given kind, so
// the whole gallery adds a few materials, not dozens. Created per gallery
// instance (not module-scoped) so destroy() can dispose them safely.

export interface SceneResources {
  unitPlane: THREE.PlaneGeometry;
  glowTexture: THREE.CanvasTexture;
  wallGlowMat: THREE.MeshBasicMaterial;
  floorGlowMat: THREE.MeshBasicMaterial;
  fixtureMat: THREE.MeshBasicMaterial;
  frameMat: THREE.MeshLambertMaterial;
}

export function createSceneResources(): SceneResources {
  const glowTexture = makeGlowTexture();
  return {
    unitPlane: new THREE.PlaneGeometry(1, 1),
    glowTexture,
    wallGlowMat: new THREE.MeshBasicMaterial({
      map: glowTexture, transparent: true, depthWrite: false,
      blending: THREE.AdditiveBlending, opacity: 0.55
    }),
    floorGlowMat: new THREE.MeshBasicMaterial({
      map: glowTexture, transparent: true, depthWrite: false,
      blending: THREE.AdditiveBlending, opacity: 0.3
    }),
    fixtureMat: new THREE.MeshBasicMaterial({ color: 0xfff4e2 }),
    frameMat: new THREE.MeshLambertMaterial({ color: 0x1a160f })
  };
}

export function disposeSceneResources(res: SceneResources): void {
  res.unitPlane.dispose();
  res.glowTexture.dispose();
  res.wallGlowMat.dispose();
  res.floorGlowMat.dispose();
  res.fixtureMat.dispose();
  res.frameMat.dispose();
}

// ---- room shell + lighting ------------------------------------------------

/** Floor, ceiling, walls, ceiling fixtures, and the (tiny) light rig. */
export function buildRoom(scene: THREE.Scene, roomLength: number, res: SceneResources): void {
  const midZ = -roomLength / 2;

  // Floor — pale gallery hardwood.
  const floorTex = makeFloorTexture();
  floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping;
  floorTex.repeat.set(ROOM.width / 1.5, roomLength / 2.0);
  floorTex.anisotropy = 4;
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(ROOM.width, roomLength),
    new THREE.MeshLambertMaterial({ map: floorTex })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.z = midZ;
  scene.add(floor);

  // Ceiling — warm dark grey with a touch of emissive so it never reads as a
  // black void, plus bright "fixture" quads punched into it.
  const ceiling = new THREE.Mesh(
    new THREE.PlaneGeometry(ROOM.width, roomLength),
    new THREE.MeshLambertMaterial({ color: 0x2e2a23, emissive: 0x191611 })
  );
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.set(0, ROOM.height, midZ);
  scene.add(ceiling);

  for (let z = -CEILING_FIXTURE_SPACING * 0.7; z > -roomLength; z -= CEILING_FIXTURE_SPACING) {
    const fixture = new THREE.Mesh(res.unitPlane, res.fixtureMat);
    fixture.scale.set(1.4, 0.22, 1);
    fixture.rotation.x = Math.PI / 2;
    fixture.position.set(0, ROOM.height - 0.01, z);
    scene.add(fixture);
  }

  // Walls — warm white.
  const wallMat = new THREE.MeshLambertMaterial({ color: 0xe8e0cf });
  const addWall = (geo: THREE.PlaneGeometry, x: number, z: number, ry: number) => {
    const w = new THREE.Mesh(geo, wallMat);
    w.position.set(x, ROOM.height / 2, z);
    w.rotation.y = ry;
    scene.add(w);
  };
  const sideGeo = new THREE.PlaneGeometry(roomLength, ROOM.height);
  addWall(sideGeo, -ROOM.width / 2, midZ, Math.PI / 2);
  addWall(sideGeo.clone(), ROOM.width / 2, midZ, -Math.PI / 2);
  const endGeo = new THREE.PlaneGeometry(ROOM.width, ROOM.height);
  addWall(endGeo, 0, 0.02, Math.PI);
  addWall(endGeo.clone(), 0, -roomLength, 0);

  // The entire real light rig: a warm/dark hemisphere gradient, a warm key from
  // the entrance, and a faint cool fill from above.
  scene.add(new THREE.HemisphereLight(0xfff2dd, 0x6b6256, 1.05));
  const key = new THREE.DirectionalLight(0xfff1da, 0.55);
  key.position.set(3, 8, 6);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xdfe6ef, 0.18);
  fill.position.set(-4, 7, -3);
  scene.add(fill);
}

// ---- works ----------------------------------------------------------------

/** Per-painting data carried on the mesh's userData, used by click-to-focus. */
export interface PaintingUserData {
  /** +1 if the wall is on the left (painting normal points +x), -1 on the right. */
  facingInward: number;
  /** Index of the owning Work within the series (for syncing the wall label). */
  workIndex: number;
}

/**
 * Hang every Work as a cluster of framed panels, each with a plaque and faked
 * light. Returns the painting panel meshes (for raycasting on click).
 */
export function placeWorks(
  scene: THREE.Scene,
  series: Series,
  layout: SeriesLayout,
  res: SceneResources
): THREE.Mesh[] {
  const paintingMeshes: THREE.Mesh[] = [];
  for (const wl of layout.works) {
    placeWork(scene, series.id, wl, res, paintingMeshes);
  }
  return paintingMeshes;
}

function placeWork(
  scene: THREE.Scene,
  seriesId: string,
  wl: WorkLayout,
  res: SceneResources,
  out: THREE.Mesh[]
): void {
  const facing = wl.onLeft ? Math.PI / 2 : -Math.PI / 2;
  // Sign of "into the room" along x from this wall (+1 left wall, -1 right wall).
  const inward = wl.onLeft ? 1 : -1;
  const paintingX = wl.wallX + inward * WALL_OFFSET;
  const frameCenterX = wl.wallX + inward * (FRAME_DEPTH / 2);

  for (const panel of wl.panels) {
    const z = wl.centerZ + panel.offsetZ;

    // Faked spotlight wash on the wall, behind the (opaque) painting, so only the
    // halo around the piece shows — exactly how a wall-washed work looks.
    const wallGlow = new THREE.Mesh(res.unitPlane, res.wallGlowMat);
    wallGlow.scale.set(panel.width * 1.8, panel.height * 2.4, 1);
    wallGlow.position.set(wl.wallX + inward * 0.008, ART_CENTER_Y + WALL_GLOW_RISE, z);
    wallGlow.rotation.y = facing;
    scene.add(wallGlow);

    // Spill on the floor at the foot of the wall.
    const floorGlow = new THREE.Mesh(res.unitPlane, res.floorGlowMat);
    floorGlow.scale.set(1.6, panel.width * 1.5, 1);
    floorGlow.rotation.x = -Math.PI / 2;
    floorGlow.position.set(wl.wallX + inward * 0.85, 0.025, z);
    scene.add(floorGlow);

    // Frame: a shallow box proud of the wall.
    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(panel.width + FRAME_BORDER * 2, panel.height + FRAME_BORDER * 2, FRAME_DEPTH),
      res.frameMat
    );
    frame.position.set(frameCenterX, ART_CENTER_Y, z);
    frame.rotation.y = facing;
    scene.add(frame);

    // The painting itself — unlit, full-colour.
    const mesh = new THREE.Mesh(
      res.unitPlane,
      new THREE.MeshBasicMaterial({ map: loadPaintingTexture(seriesId, panel.image.file) })
    );
    mesh.scale.set(panel.width, panel.height, 1);
    mesh.position.set(paintingX, ART_CENTER_Y, z);
    mesh.rotation.y = facing;
    mesh.userData = { facingInward: inward, workIndex: wl.index } satisfies PaintingUserData;
    scene.add(mesh);
    out.push(mesh);
  }

  // Wall plaque, just past the entrance-side (+z) edge of the cluster, hung low.
  // Lambert (not Basic) so it takes the same lighting as the wall it sits on.
  const plaque = new THREE.Mesh(res.unitPlane, new THREE.MeshLambertMaterial({ map: makePlaqueTexture(wl.work) }));
  plaque.scale.set(0.52, 0.29, 1);
  // Sits a few cm proud of the wall — far enough off it (and off the wall-glow
  // quad at 0.008) that there's no depth-test tie to flicker over.
  plaque.position.set(wl.wallX + inward * 0.03, PLAQUE_Y, wl.centerZ + wl.spanZ / 2 + 0.4);
  plaque.rotation.y = facing;
  scene.add(plaque);
}
