<script setup lang="ts">
import { ref } from "vue"
import { cn } from "./cn"
import LifelinePhotoCard from "./LifelinePhotoCard.vue"
import type { LifelinePhoto } from "./types"

const MAX_TILT_DEG = 6

/** A fresh tilt on every visit — rolled once per card mount. */
function randomTilt() {
  return 2 + Math.random() * (MAX_TILT_DEG - 2)
}

const props = withDefaults(
  defineProps<{
    photo: LifelinePhoto
    stackIndex: number
    stackCount: number
    /** Resolved left position within the track. */
    x: number
    /** Cascade position when the photo has no explicit y. */
    defaultY: number
    width: number
    animateIntro?: boolean
    introDelay?: number
    introDuration?: number
    /** Filtered out? Fade rather than unmount, so the stack stays put. */
    visible?: boolean
  }>(),
  { animateIntro: false, introDelay: 0, introDuration: 420, visible: true },
)

const y = props.photo.y ?? props.defaultY

// Rolled once per mount: solo cards flip a coin for direction; neighbors
// in a stack lean away from each other so the pile reads as scattered.
const mountTilt = ref(
  (() => {
    const sign =
      props.stackCount > 1
        ? props.stackIndex % 2 === 0
          ? -1
          : 1
        : Math.random() > 0.5
          ? 1
          : -1
    return sign * randomTilt()
  })(),
)
</script>

<template>
  <!--
    `left` eases so a card rides the column resize the track filter causes
    instead of snapping ahead of it. Only `left` — `top` is what dragging
    moves, and a transition there would drag like treacle.
  -->
  <LifelinePhotoCard
    :photo="props.photo"
    :rotate="props.photo.rotate ?? mountTilt"
    :width="props.width"
    :class="
      cn(
        'absolute transition-[left,opacity,transform] duration-[420ms] ease-out',
        !props.visible && 'pointer-events-none scale-95 opacity-0',
      )
    "
    :style="{ left: `${props.x}px`, top: `calc(var(--lifeline-rail) + ${y}px)` }"
    :animate-intro="props.animateIntro"
    :intro-delay="props.introDelay"
    :intro-duration="props.introDuration"
  />
</template>
