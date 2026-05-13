<script setup lang="ts">
import { computed } from 'vue';
import { getSeries } from '~/content';
import type { Work } from '~/types';

interface Props { seriesId: string }
const props = defineProps<Props>();

const series = computed(() => getSeries(props.seriesId));

function creditLine(work: Work): string {
  const parts: string[] = [];
  if (work.medium) parts.push(work.medium);
  if (work.dimensions) parts.push(work.dimensions);
  if (work.images.length > 1) parts.push(`${work.images.length} panels`);
  return parts.join(' · ');
}

function paintingUrl(file: string): string {
  return `/paintings/${series.value!.id}/${file}`;
}
</script>

<template>
  <main
    v-if="series"
    class="h-[100svh] w-full overflow-y-auto overflow-x-hidden bg-gallery-deep text-cream-100"
    style="scroll-snap-type: y proximity;"
  >
    <section
      class="flex min-h-[100svh] flex-col justify-between px-6 pb-12 pt-8"
      style="scroll-snap-align: start;"
    >
      <a href="/gallery" class="font-sans text-[11px] uppercase tracking-widest text-cream-100/55">
        ← All exhibitions
      </a>
      <div>
        <div class="mb-3 font-sans text-[11px] uppercase tracking-widest text-cream-100/55">
          Room {{ series.number }}
        </div>
        <h1 class="mb-6 font-serif text-5xl font-normal leading-[1.05] tracking-tight">
          {{ series.title }}
        </h1>
        <p class="font-serif text-[18px] italic leading-relaxed text-cream-100/70">
          {{ series.intro.body }}
        </p>
      </div>
      <div class="font-sans text-[11px] uppercase tracking-widest text-cream-100/40">
        Swipe up ↑
      </div>
    </section>

    <section
      v-for="(work, wi) in series.works"
      :key="work.id"
      class="flex min-h-[100svh] flex-col px-6 pb-10 pt-8"
      style="scroll-snap-align: start;"
    >
      <div v-if="work.images.length === 1" class="flex min-h-0 flex-1 items-center justify-center">
        <img
          :src="paintingUrl(work.images[0]!.file)"
          :alt="work.title"
          :loading="wi === 0 ? 'eager' : 'lazy'"
          class="max-h-full max-w-full object-contain"
        />
      </div>
      <div v-else class="flex flex-col items-center gap-4 py-4">
        <figure
          v-for="(img, pi) in work.images"
          :key="img.file"
          class="flex w-full flex-col items-center"
        >
          <img
            :src="paintingUrl(img.file)"
            :alt="`${work.title}${img.panelLabel ? ` — ${img.panelLabel}` : ''}`"
            loading="lazy"
            class="max-h-[65svh] w-auto max-w-full object-contain"
          />
          <figcaption
            v-if="img.panelLabel"
            class="mt-2 font-sans text-[10px] uppercase tracking-widest text-cream-100/45"
          >
            {{ img.panelLabel }} · {{ pi + 1 }} / {{ work.images.length }}
          </figcaption>
        </figure>
      </div>

      <div class="shrink-0 pt-6">
        <div v-if="work.year" class="mb-2 font-sans text-[10px] uppercase tracking-widest text-cream-100/55">
          {{ work.year }}
        </div>
        <div class="mb-2 font-serif text-3xl italic leading-tight text-cream-100">
          {{ work.title }}
        </div>
        <div v-if="creditLine(work)" class="mb-3 font-sans text-[11px] uppercase tracking-wider text-cream-100/55">
          {{ creditLine(work) }}
        </div>
        <div v-if="work.story" class="font-serif text-[15px] leading-relaxed text-cream-100/75">
          {{ work.story }}
        </div>
      </div>
    </section>

    <section
      class="flex min-h-[100svh] flex-col items-center justify-center gap-8 px-6 text-center"
      style="scroll-snap-align: start;"
    >
      <div class="font-sans text-[11px] uppercase tracking-widest text-cream-100/55">
        End of {{ series.title }}
      </div>
      <a
        href="/gallery"
        class="rounded-sm bg-cream-50 px-6 py-3 font-sans text-[13px] uppercase tracking-wider text-ink-900"
      >
        Back to exhibitions
      </a>
    </section>
  </main>
</template>
