<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue';
import { galleryState, unfocusPainting } from '~/gallery/state';

const painting = computed(() => galleryState.focusedPainting);

const eyebrow = computed(() => {
  if (!painting.value || !galleryState.series) return '';
  return `${galleryState.series.title.toUpperCase()} · ${painting.value.year}`;
});

const meta = computed(() => {
  if (!painting.value) return '';
  return `${painting.value.medium.toUpperCase()} · ${painting.value.dimensions}`;
});

const paintingStyle = computed(() => {
  if (!painting.value) return {};
  if (painting.value.image) {
    return {
      backgroundImage: `url('/paintings/${painting.value.image}')`,
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    };
  }
  return { backgroundColor: painting.value.placeholderColor };
});

function close() {
  unfocusPainting();
}

function handleBackdropClick(e: MouseEvent) {
  if (e.target === e.currentTarget) close();
}

// Esc to close.
function handleKey(e: KeyboardEvent) {
  if (e.key === 'Escape' && galleryState.focusedPainting) close();
}
onMounted(() => window.addEventListener('keydown', handleKey));
onUnmounted(() => window.removeEventListener('keydown', handleKey));
</script>

<template>
  <Transition
    enter-active-class="transition-opacity duration-300"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition-opacity duration-300"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div
      v-if="painting"
      class="absolute inset-0 z-20 flex flex-col items-center justify-center gap-7 bg-gallery-deeper/95 p-12"
      @click="handleBackdropClick"
    >
      <button
        class="absolute right-7 top-7 cursor-pointer px-3 py-2 font-sans text-[11px] uppercase tracking-wider text-cream-100/60 transition-colors hover:text-cream-100"
        @click="close"
      >
        Close ✕
      </button>

      <div
        class="rounded-sm"
        :style="paintingStyle"
        style="width: min(480px, 60vw); aspect-ratio: 4 / 3;"
      ></div>

      <div class="max-w-xl text-center">
        <div class="mb-3 font-sans text-[10px] uppercase tracking-widest text-cream-100/50">
          {{ eyebrow }}
        </div>
        <div class="mb-2 font-serif text-3xl italic text-cream-100">
          {{ painting.title }}
        </div>
        <div class="mb-5 font-sans text-[11px] uppercase tracking-wider text-cream-100/55">
          {{ meta }}
        </div>
        <div class="font-serif text-[15px] leading-relaxed text-cream-100/80">
          {{ painting.story }}
        </div>
      </div>
    </div>
  </Transition>
</template>
