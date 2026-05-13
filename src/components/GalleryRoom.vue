<script setup lang="ts">
import { onMounted, ref } from 'vue';
import GalleryRoomImmersive from './GalleryRoomImmersive.vue';
import GalleryRoomMobile from './GalleryRoomMobile.vue';

interface Props { seriesId: string }
defineProps<Props>();

// The immersive 3D walkthrough is built for landscape viewports with a
// mouse/trackpad. On phones it's cramped, the camera choreography fights with
// touch scrolling, and three.js is dead weight. Pick a view once on mount;
// don't react to resize, since switching mid-session would tear down a
// half-built scene or scroll state.
type Mode = 'pending' | 'immersive' | 'mobile';
const mode = ref<Mode>('pending');

onMounted(() => {
  mode.value = window.matchMedia('(max-width: 767px)').matches ? 'mobile' : 'immersive';
});
</script>

<template>
  <GalleryRoomImmersive v-if="mode === 'immersive'" :seriesId="seriesId" />
  <GalleryRoomMobile v-else-if="mode === 'mobile'" :seriesId="seriesId" />
  <div v-else class="h-screen w-full bg-gallery-deep"></div>
</template>
