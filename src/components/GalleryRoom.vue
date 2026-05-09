<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { initGallery, type GalleryHandle } from '~/gallery/init';
import { getSeries } from '~/content';
import GalleryOverlay from './GalleryOverlay.vue';
import FocusModal from './FocusModal.vue';
import ScrollHint from './ScrollHint.vue';
import ProgressBar from './ProgressBar.vue';

interface Props {
  seriesId: string;
}
const props = defineProps<Props>();

const canvasRef = ref<HTMLCanvasElement | null>(null);
const containerRef = ref<HTMLElement | null>(null);
let handle: GalleryHandle | null = null;

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
    series,
    scrollDistance: 5000
  });
});

onUnmounted(() => {
  handle?.destroy();
});
</script>

<template>
  <div ref="containerRef" class="relative h-screen w-full overflow-hidden bg-gallery-deep">
    <canvas
      ref="canvasRef"
      class="absolute inset-0 block h-full w-full cursor-pointer"
    ></canvas>

    <ProgressBar />

    <div
      class="absolute left-8 top-6 z-10 font-sans text-[11px] uppercase tracking-widest text-cream-100/50"
    >
      Room I · Venezuela Impressions
    </div>

    <ScrollHint />
    <GalleryOverlay />
    <FocusModal />
  </div>
</template>
