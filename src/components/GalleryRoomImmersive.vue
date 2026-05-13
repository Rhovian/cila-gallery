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

  handle = initGallery({
    canvas: canvasRef.value,
    scrollContainer: containerRef.value,
    series
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

    <div
      v-if="roomLabel"
      class="absolute left-8 top-6 z-10 font-sans text-[11px] uppercase tracking-widest text-cream-100/50"
    >
      {{ roomLabel }}
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
