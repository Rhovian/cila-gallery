<script setup lang="ts">
import { computed } from 'vue';
import { galleryState } from '~/gallery/state';
import { buildMoments } from '~/gallery/moments';
import type { Moment } from '~/types';

const moments = computed<Moment[]>(() =>
  galleryState.series ? buildMoments(galleryState.series) : []
);

// The moment currently in view, derived from the active index in shared state.
const active = computed<Moment | null>(() => {
  const idx = galleryState.activeMomentIndex;
  if (idx === null || idx < 0 || idx >= moments.value.length) return null;
  return moments.value[idx] ?? null;
});

// The work behind the active moment, if any (the room intro has no work).
const work = computed(() => {
  if (!active.value || active.value.workIndex === null || !galleryState.series) return null;
  return galleryState.series.works[active.value.workIndex] ?? null;
});

const eyebrow = computed(() => {
  if (work.value) return work.value.year ?? '';
  return active.value?.eyebrow ?? '';
});

const title = computed(() => work.value?.title ?? active.value?.title ?? '');

// Wall-label credit line: medium · dimensions · panel count, whatever's known.
const credit = computed(() => {
  if (!work.value) return '';
  const parts: string[] = [];
  if (work.value.medium) parts.push(work.value.medium);
  if (work.value.dimensions) parts.push(work.value.dimensions);
  if (work.value.images.length > 1) parts.push(`${work.value.images.length} works`);
  return parts.join(' · ');
});

const body = computed(() => work.value?.story ?? active.value?.body ?? '');
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
      v-if="active && !galleryState.atRest && (title || body)"
      class="pointer-events-none absolute bottom-20 left-12 z-10 max-w-md md:left-12 md:max-w-md max-md:left-6 max-md:right-6 max-md:max-w-none"
    >
      <div
        v-if="eyebrow"
        class="mb-3 font-sans text-[10px] uppercase tracking-widest text-cream-100/50"
      >
        {{ eyebrow }}
      </div>
      <div class="mb-2 font-serif text-3xl italic leading-tight text-cream-100 max-md:text-2xl">
        {{ title }}
      </div>
      <div
        v-if="credit"
        class="mb-4 font-sans text-[11px] uppercase tracking-wider text-cream-100/55"
      >
        {{ credit }}
      </div>
      <div v-if="body" class="font-serif text-[15px] leading-relaxed text-cream-100/75">
        {{ body }}
      </div>
    </div>
  </Transition>
</template>
