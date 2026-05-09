// Three.js scene construction.
// Builds the room geometry, lighting, and painting placement for a Series.

import * as THREE from 'three';
import type { Painting, Series } from '~/types';

export const ROOM = {
  length: 40,
  width: 6,
  height: 4
} as const;

const PAINTING_SPACING = 6.5;
const PAINTING_START_Z = -4;
const PAINTING_HEIGHT = 1.7;
const PAINTING_W = 1.6;
const PAINTING_H = 1.2;

export interface PaintingMeshUserData {
  painting: Painting;
  index: number;
  onLeft: boolean;
}

export type PaintingMesh = THREE.Mesh<
  THREE.PlaneGeometry,
  THREE.MeshStandardMaterial
> & { userData: PaintingMeshUserData };

/**
 * Procedural placeholder texture, used until real images are dropped in.
 * Replace by setting `painting.image` to a filename in /public/paintings/.
 */
function makePlaceholderTexture(painting: Painting): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 384;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas context unavailable');

  ctx.fillStyle = painting.placeholderColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // City silhouette (lower portion)
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.fillRect(0, canvas.height * 0.55, canvas.width, canvas.height * 0.45);
  for (let x = 0; x < canvas.width; x += 48) {
    const h = 100 + Math.random() * 80;
    ctx.fillRect(x, canvas.height * 0.55 - h * 0.3, 40, h);
  }

  // Sun / accent
  ctx.fillStyle = painting.placeholderAccent;
  ctx.beginPath();
  ctx.arc(canvas.width * 0.7, canvas.height * 0.25, 44, 0, Math.PI * 2);
  ctx.fill();

  // Bird marks
  ctx.strokeStyle = '#f5e6c8';
  ctx.lineWidth = 3;
  for (let b = 0; b < 6; b++) {
    const bx = 50 + b * 70 + Math.random() * 30;
    const by = 50 + Math.random() * 80;
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.quadraticCurveTo(bx + 10, by - 10, bx + 20, by);
    ctx.quadraticCurveTo(bx + 30, by - 10, bx + 40, by);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function loadPaintingTexture(filename: string): THREE.Texture {
  const loader = new THREE.TextureLoader();
  const tex = loader.load(`/paintings/${filename}`);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/** Build the room shell: floor, four walls, ambient fill. */
export function buildRoom(scene: THREE.Scene): void {
  const floorMat = new THREE.MeshStandardMaterial({
    color: 0x2a2622,
    roughness: 0.9
  });
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(ROOM.width, ROOM.length),
    floorMat
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.z = -ROOM.length / 2;
  scene.add(floor);

  const wallMat = new THREE.MeshStandardMaterial({
    color: 0xf5f0e6,
    roughness: 0.95
  });

  const left = new THREE.Mesh(
    new THREE.PlaneGeometry(ROOM.length, ROOM.height),
    wallMat
  );
  left.position.set(-ROOM.width / 2, ROOM.height / 2, -ROOM.length / 2);
  left.rotation.y = Math.PI / 2;
  scene.add(left);

  const right = new THREE.Mesh(
    new THREE.PlaneGeometry(ROOM.length, ROOM.height),
    wallMat
  );
  right.position.set(ROOM.width / 2, ROOM.height / 2, -ROOM.length / 2);
  right.rotation.y = -Math.PI / 2;
  scene.add(right);

  const back = new THREE.Mesh(
    new THREE.PlaneGeometry(ROOM.width, ROOM.height),
    wallMat
  );
  back.position.set(0, ROOM.height / 2, 0.01);
  back.rotation.y = Math.PI;
  scene.add(back);

  const front = new THREE.Mesh(
    new THREE.PlaneGeometry(ROOM.width, ROOM.height),
    wallMat
  );
  front.position.set(0, ROOM.height / 2, -ROOM.length);
  scene.add(front);

  scene.add(new THREE.AmbientLight(0xfff4e0, 0.25));
}

/** Place a series' paintings, alternating walls. Returns meshes for raycasting. */
export function placePaintings(scene: THREE.Scene, series: Series): PaintingMesh[] {
  const meshes: PaintingMesh[] = [];
  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x1a1612,
    roughness: 0.6
  });

  series.paintings.forEach((p, i) => {
    const tex = p.image ? loadPaintingTexture(p.image) : makePlaceholderTexture(p);
    const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.7 });
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(PAINTING_W, PAINTING_H),
      mat
    ) as PaintingMesh;

    const onLeft = i % 2 === 0;
    const z = PAINTING_START_Z - i * PAINTING_SPACING;

    if (onLeft) {
      mesh.position.set(-ROOM.width / 2 + 0.02, PAINTING_HEIGHT, z);
      mesh.rotation.y = Math.PI / 2;
    } else {
      mesh.position.set(ROOM.width / 2 - 0.02, PAINTING_HEIGHT, z);
      mesh.rotation.y = -Math.PI / 2;
    }
    mesh.userData = { painting: p, index: i, onLeft };
    scene.add(mesh);
    meshes.push(mesh);

    // Frame (slightly behind)
    const frame = new THREE.Mesh(
      new THREE.PlaneGeometry(PAINTING_W + 0.08, PAINTING_H + 0.08),
      frameMat
    );
    frame.position.copy(mesh.position);
    if (onLeft) {
      frame.position.x += 0.005;
      frame.rotation.y = Math.PI / 2;
    } else {
      frame.position.x -= 0.005;
      frame.rotation.y = -Math.PI / 2;
    }
    scene.add(frame);

    // Spotlight
    const spot = new THREE.SpotLight(0xfff0d4, 1.6, 6, Math.PI / 6, 0.4, 1);
    spot.position.set(
      onLeft ? -ROOM.width / 2 + 1.5 : ROOM.width / 2 - 1.5,
      ROOM.height - 0.3,
      z
    );
    spot.target = mesh;
    scene.add(spot);
    scene.add(spot.target);
  });

  return meshes;
}
