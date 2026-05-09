<script setup lang="ts">
import { galleryState } from '~/gallery/state';
</script>

<template>
  <Transition
    enter-active-class="transition-opacity duration-500"
    leave-active-class="transition-opacity duration-700"
    enter-from-class="opacity-0"
    leave-to-class="opacity-0"
  >
    <div
      v-if="!galleryState.hasScrolled"
      class="pointer-events-none absolute bottom-8 left-1/2 z-10 -translate-x-1/2 animate-pulse font-sans text-[11px] uppercase tracking-widest text-cream-100/70"
    >
      Scroll to enter ↓
    </div>
  </Transition>
</template>
