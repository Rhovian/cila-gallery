<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { initGallery, type GalleryHandle } from '~/gallery/init';
import { getSeries } from '~/content';
import { galleryState } from '~/gallery/state';
import GalleryOverlay from './GalleryOverlay.vue';
import ScrollHint from './ScrollHint.vue';
import ProgressBar from './ProgressBar.vue';

interface Props {
  seriesId: string;
}
const props = defineProps<Props>();

const canvasRef = ref<HTMLCanvasElement | null>(null);
const containerRef = ref<HTMLElement | null>(null);
let handle: GalleryHandle | null = null;

const roomLabel = computed(() => {
  const s = galleryState.series;
  return s ? `Room ${s.number} · ${s.title}` : '';
});

onMounted(() => {
  const series = getSeries(props.seriesId);
  if (!series) {
    console.error(`Series not found: ${props.seriesId}`);
    return;
  }
  if (!canvasRef.value || !containerRef.value) return;

  // On phones, hand the choreography a flag so the per-work linger drops into
  // a fit-to-screen close-up (and steps through panels along the wall) instead
  // of the wider corridor framing that suits a landscape viewport. Decided
  // once at mount — switching mid-session would tear down the running timeline.
  const isMobile = window.matchMedia('(max-width: 767px)').matches;

  handle = initGallery({
    canvas: canvasRef.value,
    scrollContainer: containerRef.value,
    series,
    isMobile
  });
});

onUnmounted(() => {
  handle?.destroy();
});
</script>

<template>
  <div ref="containerRef" class="relative h-screen w-full overflow-hidden bg-gallery-deep">
    <canvas ref="canvasRef" class="absolute inset-0 block h-full w-full cursor-pointer"></canvas>

    <ProgressBar />

    <div class="pointer-events-none absolute left-4 top-4 z-10 flex flex-col gap-2 md:left-8 md:top-6">
      <a
        href="/gallery"
        class="pointer-events-auto font-sans text-[11px] uppercase tracking-widest text-cream-100/70 transition-colors hover:text-cream-100"
      >
        ← Exhibitions
      </a>
      <div v-if="roomLabel" class="font-sans text-[11px] uppercase tracking-widest text-cream-100/50">
        {{ roomLabel }}
      </div>
    </div>

    <ScrollHint />
    <GalleryOverlay />

    <Transition
      enter-active-class="transition-opacity duration-500"
      leave-active-class="transition-opacity duration-300"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div
        v-if="galleryState.focused"
        class="pointer-events-none absolute bottom-8 left-1/2 z-10 -translate-x-1/2 font-sans text-[11px] uppercase tracking-widest text-cream-100/55"
      >
        Scroll or click away to return
      </div>
    </Transition>
  </div>
</template>
