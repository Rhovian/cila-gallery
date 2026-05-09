<script setup lang="ts">
import { computed } from 'vue';
import { galleryState } from '~/gallery/state';
import { buildMoments } from '~/gallery/moments';
import type { Moment } from '~/types';

const moments = computed<Moment[]>(() =>
  galleryState.series ? buildMoments(galleryState.series) : []
);

// Currently displayed moment, derived from the active index in shared state.
const active = computed<Moment | null>(() => {
  const idx = galleryState.activeMomentIndex;
  if (idx === null || idx < 0 || idx >= moments.value.length) return null;
  return moments.value[idx] ?? null;
});

// Resolve display text from either intro fields or the painting at paintingIndex.
const eyebrow = computed(() => {
  if (!active.value || !galleryState.series) return '';
  if (active.value.paintingIndex !== null) {
    const p = galleryState.series.paintings[active.value.paintingIndex];
    return p ? `${p.year} · ${p.medium.toUpperCase()}` : '';
  }
  return active.value.eyebrow ?? '';
});

const title = computed(() => {
  if (!active.value || !galleryState.series) return '';
  if (active.value.paintingIndex !== null) {
    return galleryState.series.paintings[active.value.paintingIndex]?.title ?? '';
  }
  return active.value.title ?? '';
});

const body = computed(() => {
  if (!active.value || !galleryState.series) return '';
  if (active.value.paintingIndex !== null) {
    return galleryState.series.paintings[active.value.paintingIndex]?.story ?? '';
  }
  return active.value.body ?? '';
});
</script>

<template>
  <Transition
    enter-active-class="transition-opacity duration-700"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition-opacity duration-500"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div
      v-if="active"
      class="pointer-events-none absolute bottom-20 left-12 z-10 max-w-md md:left-12 md:max-w-md max-md:left-6 max-md:right-6 max-md:max-w-none"
    >
      <div class="mb-3 font-sans text-[10px] uppercase tracking-widest text-cream-100/50">
        {{ eyebrow }}
      </div>
      <div class="mb-4 font-serif text-3xl italic leading-tight text-cream-100 max-md:text-2xl">
        {{ title }}
      </div>
      <div class="font-serif text-[15px] leading-relaxed text-cream-100/75">
        {{ body }}
      </div>
    </div>
  </Transition>
</template>
