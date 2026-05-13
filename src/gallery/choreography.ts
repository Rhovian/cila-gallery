// Camera choreography via GSAP.
//
// Builds a scrubbed timeline that walks the camera down the room: it travels to
// a viewing spot in front of each Work while turning to face that wall, lingers
// there (the wall label reads during this beat), then turns back toward the
// corridor and moves on to the next. The tour ends settled in front of the last
// painting — it never drifts past it onto an empty wall.
//
// Click-to-focus: clicking a painting glides the camera right up to it (still in
// the 3D room — no modal); clicking elsewhere or scrolling pulls back out to the
// tour. While focused the timeline keeps tracking the scroll, so the moment any
// scroll happens we hand control back to it seamlessly.
//
// The render loop calls `applyToCamera()` each frame to push the tweened
// position/look-at onto the actual camera, plus a small time-based sway so the
// view never feels frozen when the scroll is still.

import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { setProgress, setActiveMoment, setFocused } from './state';
import { ART_CENTER_Y, type SeriesLayout } from './layout';
import type { PaintingUserData } from './scene';

gsap.registerPlugin(ScrollTrigger);

const EYE_Y = 1.62;             // camera height while walking the corridor (m)
const CORRIDOR_LOOKAHEAD = 7;   // how far down the hall the camera looks while moving (m)

// How hard to throttle the camera. ScrollTrigger's `scrub` smooths the timeline
// playhead; on top of that the camera itself chases the tweened position/target
// with exponential damping, so a fast flick of the scroll wheel never lurches —
// the view always glides. Higher = lazier / more cinematic; lower = snappier.
const SCRUB = 0.8;              // seconds of catch-up lag on the timeline playhead
const CAMERA_SMOOTH_TIME = 0.28; // seconds; time-constant of the camera's own damping

// Segment durations in timeline-local units; only their ratios matter.
const D_INTRO = 1.0;       // a brief hold at the threshold before walking in
const D_APPROACH = 1.5;    // walk up to a work, turning to face it
const D_LINGER = 1.2;      // stand in front of it
const D_DISENGAGE = 0.5;   // turn back toward the corridor (between works only)
const D_FINAL_HOLD = 1.6;  // extra dwell on the last work so the tour eases to a close

const FOCUS_MARGIN = 1.12; // a clicked painting fills the frame minus a little air
const FOCUS_MIN_DIST = 0.6;
const FOCUS_MAX_DIST = 4.0;

export interface ChoreographyTrigger extends ScrollTrigger {
  applyToCamera(): void;
  /** Glide in to a close-up of this painting mesh (toggles off if already on it). */
  focusOn(mesh: THREE.Mesh): void;
  /** Pull back out of any close-up, returning to the scroll-driven tour. */
  clearFocus(): void;
}

interface Options {
  camera: THREE.PerspectiveCamera;
  layout: SeriesLayout;
  /** The DOM element whose scroll drives the timeline (also the pin target). */
  scrollContainer: HTMLElement;
  /** Total scroll distance in pixels to traverse the whole timeline. */
  scrollDistance: number;
}

export function setupCameraChoreography({
  camera,
  layout,
  scrollContainer,
  scrollDistance
}: Options): ChoreographyTrigger {
  // GSAP tweens these plain objects; applyToCamera() reads them each frame.
  const pos = { x: 0, y: EYE_Y, z: 0 };
  const target = { x: 0, y: EYE_Y, z: -CORRIDOR_LOOKAHEAD };

  const tl = gsap.timeline({ paused: true });

  // Intro — stand at the threshold, looking down the hall.
  tl.to(pos, { duration: D_INTRO, y: EYE_Y });

  const workStartTimes: number[] = [];
  layout.works.forEach((wl, i) => {
    const isLast = i === layout.works.length - 1;
    const t = tl.duration();
    workStartTimes.push(t);
    // Approach: move to the viewing spot while turning to face the wall.
    tl.to(pos, { x: 0, y: EYE_Y, z: wl.centerZ, duration: D_APPROACH, ease: 'power2.inOut' }, t);
    tl.to(target, { x: wl.wallX, y: ART_CENTER_Y, z: wl.centerZ, duration: D_APPROACH, ease: 'power2.inOut' }, t);
    // Linger in front of the work — the wall label fades in over this beat. The
    // last work gets an extra dwell instead of a disengage, so the tour ends
    // settled on the final painting rather than turning to an empty wall.
    tl.to(pos, { duration: isLast ? D_LINGER + D_FINAL_HOLD : D_LINGER, y: EYE_Y });
    if (!isLast) {
      // Disengage: turn back toward the corridor before walking on.
      tl.to(target, {
        x: 0, y: EYE_Y, z: wl.centerZ - CORRIDOR_LOOKAHEAD,
        duration: D_DISENGAGE, ease: 'power1.inOut'
      });
    }
  });

  // Scroll progress at which each work becomes the "active moment", and the
  // progress to park the scroll at when a work is clicked (mid-linger in front
  // of it) so the wall label and progress bar follow, and exiting the close-up
  // leaves you standing there.
  const total = tl.duration();
  const lastIndex = layout.works.length - 1;
  const workOnset = workStartTimes.map((t) => t / total);
  const workViewProgress = workStartTimes.map((t, i) => {
    const dwell = i === lastIndex ? D_LINGER + D_FINAL_HOLD : D_LINGER;
    return THREE.MathUtils.clamp((t + D_APPROACH + dwell * 0.5) / total, 0, 1);
  });

  // ---- click-to-focus state (declared before ScrollTrigger.create so the
  // onUpdate closure can reach it safely) ----------------------------------
  let focused = false;
  let focusedMesh: THREE.Mesh | null = null;
  const focusPos = { x: 0, y: EYE_Y, z: 0 };
  const focusTarget = { x: 0, y: EYE_Y, z: 0 };
  // The last scroll position we know about. focusOn() updates this before it
  // moves the scroll programmatically, so onUpdate can tell a real user scroll
  // (position changed from here) from our own sync (position matches).
  let lastScroll = 0;

  const clearFocus = (): void => {
    if (!focused) return;
    focused = false;
    focusedMesh = null;
    setFocused(false);
  };

  const trigger = ScrollTrigger.create({
    trigger: scrollContainer,
    start: 'top top',
    end: () => `+=${scrollDistance}`,
    scrub: SCRUB,
    pin: true,
    anticipatePin: 1,
    onUpdate: (self) => {
      const p = self.progress;
      tl.progress(p);
      setProgress(p);

      const s = self.scroll();
      if (focused && Math.abs(s - lastScroll) > 1) clearFocus(); // user scrolled → leave the close-up
      lastScroll = s;

      let momentIndex = 0; // 0 = room intro
      for (let i = 0; i < workOnset.length; i++) {
        if (p >= (workOnset[i] ?? 1)) momentIndex = i + 1;
      }
      setActiveMoment(momentIndex);
    }
  }) as ChoreographyTrigger;

  const focusOn = (mesh: THREE.Mesh): void => {
    if (focused && mesh === focusedMesh) {
      clearFocus(); // clicking the painting you're zoomed on backs out
      return;
    }
    const c = mesh.position;
    const w = mesh.scale.x; // panel width  (extent along the wall = camera-horizontal)
    const h = mesh.scale.y; // panel height (extent vertically  = camera-vertical)
    const ud = mesh.userData as PaintingUserData;
    const inward = ud.facingInward || 1;

    const vFov = THREE.MathUtils.degToRad(camera.fov);
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * camera.aspect);
    const distForHeight = (h / 2) / Math.tan(vFov / 2);
    const distForWidth = (w / 2) / Math.tan(hFov / 2);
    const dist = THREE.MathUtils.clamp(
      Math.max(distForHeight, distForWidth) * FOCUS_MARGIN,
      FOCUS_MIN_DIST,
      FOCUS_MAX_DIST
    );

    focusPos.x = c.x + inward * dist;
    focusPos.y = c.y;
    focusPos.z = c.z;
    focusTarget.x = c.x;
    focusTarget.y = c.y;
    focusTarget.z = c.z;
    focused = true;
    focusedMesh = mesh;
    setFocused(true);

    // Move the tour itself to this work — wall label, progress bar, and where
    // you end up when the close-up ends all follow. Update lastScroll first so
    // the resulting onUpdate doesn't mistake this for a user scroll.
    if (typeof ud.workIndex === 'number') {
      setActiveMoment(ud.workIndex + 1);
      const prog = workViewProgress[ud.workIndex];
      if (prog !== undefined && Number.isFinite(trigger.start) && Number.isFinite(trigger.end)) {
        const px = trigger.start + prog * (trigger.end - trigger.start);
        lastScroll = px;
        trigger.scroll(px);
        lastScroll = trigger.scroll(); // re-read in case the browser clamped
      }
    }
  };

  // Ambient sway — time-based so it keeps breathing even when the scroll is still.
  const sway = { v: 0 };
  gsap.to(sway, { v: 1, duration: 4.5, repeat: -1, yoyo: true, ease: 'sine.inOut' });

  // The camera chases the tweened pos/target (or the focus pose) with frame-rate-
  // independent exponential damping. This is the "throttle": however fast the
  // timeline jumps (a hard scroll flick), the view eases toward it at a bounded
  // rate — and it's also what makes the click-to-focus glide in and out smoothly.
  const cam = { x: pos.x, y: pos.y, z: pos.z, tx: target.x, ty: target.y, tz: target.z };
  let lastT = 0;

  trigger.applyToCamera = () => {
    const now = performance.now() / 1000;
    if (lastT === 0) lastT = now;
    const dt = Math.min(now - lastT, 0.1); // clamp so a stalled tab can't teleport
    lastT = now;
    const k = 1 - Math.exp(-dt / CAMERA_SMOOTH_TIME);

    const goalPos = focused ? focusPos : pos;
    const goalTarget = focused ? focusTarget : target;
    cam.x += (goalPos.x - cam.x) * k;
    cam.y += (goalPos.y - cam.y) * k;
    cam.z += (goalPos.z - cam.z) * k;
    cam.tx += (goalTarget.x - cam.tx) * k;
    cam.ty += (goalTarget.y - cam.ty) * k;
    cam.tz += (goalTarget.z - cam.tz) * k;

    const s = (sway.v - 0.5) * 2; // -1 .. 1
    camera.position.set(cam.x + s * 0.02, cam.y + s * 0.012, cam.z);
    camera.lookAt(cam.tx, cam.ty, cam.tz);
  };

  trigger.focusOn = focusOn;
  trigger.clearFocus = clearFocus;

  return trigger;
}
