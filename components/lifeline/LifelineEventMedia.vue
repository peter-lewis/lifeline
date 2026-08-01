<script setup lang="ts">
import type { LifelineEventImage } from "./types"

/** Always-visible media embedded in the timeline. */
const props = defineProps<{ media: LifelineEventImage; class?: string }>()
</script>

<template>
  <video
    v-if="props.media.video"
    :src="props.media.video"
    :poster="props.media.src"
    autoplay
    muted
    loop
    playsinline
    preload="metadata"
    :aria-label="props.media.alt"
    :class="props.class"
  />
  <img
    v-else
    :src="props.media.src"
    :alt="props.media.alt"
    loading="lazy"
    :class="props.class"
  />
</template>
