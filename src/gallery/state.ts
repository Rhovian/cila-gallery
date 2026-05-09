// Shared reactive state for the gallery experience.
//
// GSAP ScrollTrigger writes `progress` and `activeMoment`.
// Vue components read both for rendering the overlay and modal.
// This module is the single source of truth — no other state lives elsewhere.

import { reactive, readonly } from 'vue';
import type { Painting, Series } from '~/types';

interface GalleryState {
  /** 0–1, scrubbed by ScrollTrigger. */
  progress: number;
  /** Index of the active narrative moment, or null when between moments. */
  activeMomentIndex: number | null;
  /** Painting open in the focus modal, or null when closed. */
  focusedPainting: Painting | null;
  /** The series currently being viewed. Set once on page load. */
  series: Series | null;
  /** Set to true once the user has scrolled at all. Drives scroll-hint dismissal. */
  hasScrolled: boolean;
}

const state = reactive<GalleryState>({
  progress: 0,
  activeMomentIndex: null,
  focusedPainting: null,
  series: null,
  hasScrolled: false
});

export const galleryState = readonly(state);

// Mutators — keep all writes funneled through these, not direct mutation.
// (Readonly above prevents components from mutating the proxy directly.)

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

export function focusPainting(painting: Painting): void {
  state.focusedPainting = painting;
}

export function unfocusPainting(): void {
  state.focusedPainting = null;
}
