// Shared reactive state for the gallery experience.
//
// The choreography (GSAP ScrollTrigger) writes `progress` and `activeMomentIndex`.
// Vue components read them to render the wall label and progress bar.
// This module is the single source of truth — no other state lives elsewhere.

import { reactive, readonly } from 'vue';
import type { Series } from '~/types';

interface GalleryState {
  /** 0–1, scrubbed by ScrollTrigger. */
  progress: number;
  /** Index into the moment list: 0 = room intro, 1..n = works, null during the closing drift. */
  activeMomentIndex: number | null;
  /** The series currently being viewed. Set once on page load. */
  series: Series | null;
  /** True once the user has scrolled at all. Drives scroll-hint dismissal. */
  hasScrolled: boolean;
  /** True while the camera is zoomed in on a clicked painting. */
  focused: boolean;
  /**
   * True while the camera is settled at rest on a painting (mobile fit-to-screen
   * linger). The wall label hides during this beat so the painting fills the
   * frame cleanly; it returns during approach/slide/disengage.
   */
  atRest: boolean;
}

const state = reactive<GalleryState>({
  progress: 0,
  activeMomentIndex: null,
  series: null,
  hasScrolled: false,
  focused: false,
  atRest: false
});

export const galleryState = readonly(state);

// Mutators — keep all writes funneled through these (the export above is readonly).

export function setProgress(p: number): void {
  state.progress = p;
  if (!state.hasScrolled && p > 0.005) state.hasScrolled = true;
}

export function setActiveMoment(index: number | null): void {
  state.activeMomentIndex = index;
}

export function setSeries(series: Series): void {
  state.series = series;
}

export function setFocused(focused: boolean): void {
  state.focused = focused;
}

export function setAtRest(atRest: boolean): void {
  state.atRest = atRest;
}
