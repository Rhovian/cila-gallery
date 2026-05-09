// Camera choreography via GSAP.
//
// Builds a timeline that moves the camera through the room with eases tuned
// per painting — slow approach, brief lingering pause, accelerated transition
// to the next. ScrollTrigger scrubs the timeline; scroll position drives playhead.
//
// This replaces the hand-rolled scroll smoothing from the prototype. GSAP
// handles interpolation, easing, and snap-to-section better than ad-hoc code.

import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ROOM } from './scene';
import { setProgress, setActiveMoment } from './state';
import type { Series } from '~/types';

gsap.registerPlugin(ScrollTrigger);

const PATH_START = 0;
const PATH_END = -(ROOM.length - 4);
const CAMERA_HEIGHT = 1.6;

interface CameraChoreographyOptions {
  camera: THREE.PerspectiveCamera;
  series: Series;
  /** The DOM element whose scroll drives the timeline. */
  scrollContainer: HTMLElement;
  /** Total scroll distance in pixels. Roughly one viewport per painting feels right. */
  scrollDistance: number;
}

export function setupCameraChoreography({
  camera,
  series,
  scrollContainer,
  scrollDistance
}: CameraChoreographyOptions): ScrollTrigger {
  // Object that GSAP tweens; the render loop reads from it and applies to camera.
  const cameraState = { z: PATH_START, sway: 0, progress: 0 };

  // Build the timeline. One segment per painting, with intro and outro.
  const tl = gsap.timeline({ paused: true });

  const paintingCount = series.paintings.length;
  // Distribute paintings evenly along z axis, matching scene placement.
  const paintingZ = (i: number) => -4 - i * 6.5;

  // Intro: hold at entrance briefly.
  tl.to(cameraState, { z: PATH_START, duration: 0.5, ease: 'none' });

  // Approach + linger at each painting.
  series.paintings.forEach((_, i) => {
    const targetZ = paintingZ(i) + 1.5; // stop slightly before the painting
    tl.to(cameraState, {
      z: targetZ,
      duration: 1.5,
      ease: i === 0 ? 'power2.inOut' : 'power1.inOut',
      onStart: () => setActiveMoment(i + 1) // +1 because index 0 is intro
    });
    // Linger
    tl.to(cameraState, { z: targetZ, duration: 0.8, ease: 'none' });
  });

  // Outro: drift to far end of room.
  tl.to(cameraState, { z: PATH_END, duration: 1.2, ease: 'power1.in' });

  // ScrollTrigger scrubs the timeline based on container scroll.
  const trigger = ScrollTrigger.create({
    trigger: scrollContainer,
    start: 'top top',
    end: () => `+=${scrollDistance}`,
    scrub: 0.6, // smoothing — higher = lazier follow
    pin: true,
    anticipatePin: 1,
    onUpdate: (self) => {
      tl.progress(self.progress);
      cameraState.progress = self.progress;
      setProgress(self.progress);

      // Set active moment based on raw progress for the intro region.
      // Painting moments are set by the timeline's onStart callbacks above.
      if (self.progress < 0.08) setActiveMoment(0);
    }
  });

  // Walking sway — independent of scroll, gives the camera a hint of life.
  // Tied to elapsed time, not scroll, so it doesn't freeze when stationary.
  gsap.to(cameraState, {
    sway: 1,
    duration: 1.8,
    repeat: -1,
    yoyo: true,
    ease: 'sine.inOut'
  });

  // Render hook — call from the rAF loop to apply state to the camera.
  // We attach it to the trigger object for convenient access in main.ts.
  (trigger as ScrollTrigger & { applyToCamera: () => void }).applyToCamera = () => {
    camera.position.z = cameraState.z;
    camera.position.y = CAMERA_HEIGHT + (cameraState.sway - 0.5) * 0.03;
    camera.lookAt(0, 1.7, cameraState.z - 5);
  };

  return trigger;
}

export type ChoreographyTrigger = ScrollTrigger & { applyToCamera: () => void };
