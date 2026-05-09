<script setup lang="ts">
import { computed } from 'vue';
import { galleryState } from '~/gallery/state';

const widthStyle = computed(() => ({
  width: `${galleryState.progress * 100}%`
}));
</script>

<template>
  <div class="absolute left-0 right-0 top-0 z-10 h-0.5 bg-white/10">
    <div class="h-full bg-cream-100 transition-[width] duration-100" :style="widthStyle"></div>
  </div>
</template>
