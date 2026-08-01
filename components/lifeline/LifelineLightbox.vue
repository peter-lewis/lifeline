<script setup lang="ts">
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
  type CSSProperties,
} from "vue"
import type { LifelineLightboxStart } from "./lifeline-lightbox-types"
import type { LifelinePhoto } from "./types"

const OPEN_MS = 520
/**
 * Gentle start, soft landing — the quint curve front-loaded nearly all
 * of the travel into the first 120ms, which read as a jump.
 */
const EASE = "cubic-bezier(0.32, 0.72, 0, 1)"
/** Fraction of the viewport the expanded media may occupy. */
const FIT = 0.85

const props = defineProps<{
  photo: LifelinePhoto
  /** The card's resting tilt — animated away as the media centers. */
  rotate: number
  /** The card's geometry at click time. */
  start: LifelineLightboxStart
  /** Re-measures the card at dismiss time. */
  getHome: () => LifelineLightboxStart | null
}>()

const emit = defineEmits<{ closed: [] }>()

const reduceMotion =
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches

function computeTarget(start: LifelineLightboxStart) {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const aspect = start.h / start.w
  const width = Math.min(vw * FIT, (vh * FIT) / aspect)
  const height = width * aspect
  return { left: (vw - width) / 2, top: (vh - height) / 2, width, height }
}

// Frozen on open — the target frame must not move if the viewport
// changes mid-flight.
const target = computeTarget(props.start)
const { left, top, width, height } = target

// Center-anchored FLIP: rotation and scale about the center match how
// the card itself is transformed, so the first frame is pixel-identical
// to the card underneath.
function toTransform(home: LifelineLightboxStart) {
  return `translate(${home.cx - (left + width / 2)}px, ${
    home.cy - (top + height / 2)
  }px) scale(${home.w / width}) rotate(${props.rotate}deg)`
}

const rootEl = ref<HTMLElement | null>(null)
const videoEl = ref<HTMLVideoElement | null>(null)

const entered = ref(reduceMotion)
const transform = ref(reduceMotion ? "none" : toTransform(props.start))
// Playback waits for the open transition to finish — a playing video
// decodes frames while the transform animates and drops transition
// frames on mobile; a paused, pre-seeked frame animates cheaply.
const settled = ref(reduceMotion)
let closing = false
let seeded = false
let settleTimeout = 0
let closeTimeout = 0

const figureStyle = computed<CSSProperties>(() => ({
  left: `${left}px`,
  top: `${top}px`,
  width: `${width}px`,
  height: `${height}px`,
  transform: transform.value,
  transformOrigin: "center",
  transition: reduceMotion ? undefined : `transform ${OPEN_MS}ms ${EASE}`,
  // Promoted for the whole flight — mobile otherwise re-rasterizes the
  // shadowed, corner-clipped media mid-scale.
  willChange: "transform",
}))

watch(settled, (isSettled) => {
  const video = videoEl.value
  if (!video) return

  if (isSettled) {
    // Seek only now, stationary — a seek during the transition decodes a
    // new frame mid-flight and visibly swaps the image.
    if (!seeded) {
      seeded = true
      if (props.start.mediaTime !== undefined) {
        video.currentTime = props.start.mediaTime
      }
    }
    video.play().catch(() => {
      // Autoplay rejection just leaves the poster frame showing.
    })
  } else {
    video.pause()
  }
})

function dismiss() {
  if (closing) return
  closing = true
  if (reduceMotion) {
    emit("closed")
    return
  }
  settled.value = false // freeze the video so the return flight is cheap
  entered.value = false
  transform.value = toTransform(props.getHome() ?? props.start)
  // transitionend is the primary signal; this is the safety net.
  closeTimeout = window.setTimeout(() => emit("closed"), OPEN_MS + 120)
}

function onTransitionEnd(event: TransitionEvent) {
  if (event.propertyName !== "transform") return
  if (closing) emit("closed")
  else settled.value = true
}

function onKeyDown(event: KeyboardEvent) {
  if (event.key === "Escape") dismiss()
}

// No gesture may pan while the lightbox is up — iOS otherwise
// rubber-bands the body behind the fixed overlay and can leave the whole
// page stuck offset after dismiss. Vue's listeners can't be non-passive
// here, so this needs a native one.
function blockTouch(event: TouchEvent) {
  event.preventDefault()
}

// The press that opens the card dispatches one more click right after
// pointerup — by then the clone is mounted underneath the pointer and
// would dismiss itself. Swallow exactly that click.
function swallow(event: MouseEvent) {
  event.stopPropagation()
  event.preventDefault()
}
let swallowTimeout = 0

onMounted(() => {
  window.addEventListener("keydown", onKeyDown)
  rootEl.value?.addEventListener("touchmove", blockTouch, { passive: false })

  window.addEventListener("click", swallow, { capture: true, once: true })
  swallowTimeout = window.setTimeout(() => {
    window.removeEventListener("click", swallow, { capture: true })
  }, 500)

  if (reduceMotion) return

  // FLIP: first paint sits over the card, next frame eases to center.
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      entered.value = true
      transform.value = "translate(0px, 0px) scale(1) rotate(0deg)"
    })
  })

  // Safety net if transitionend never fires for the open.
  settleTimeout = window.setTimeout(() => {
    if (!closing) settled.value = true
  }, OPEN_MS + 80)
})

onBeforeUnmount(() => {
  window.removeEventListener("keydown", onKeyDown)
  window.removeEventListener("click", swallow, { capture: true })
  rootEl.value?.removeEventListener("touchmove", blockTouch)
  window.clearTimeout(settleTimeout)
  window.clearTimeout(closeTimeout)
  window.clearTimeout(swallowTimeout)
})
</script>

<template>
  <!--
    Expands a floating card's media from its spot on the timeline to the
    center of the screen and back — a FLIP animation on a fixed clone
    teleported to <body> (the track is transformed, so fixed positioning
    inside it would break).
  -->
  <Teleport to="body">
    <div
      ref="rootEl"
      class="fixed inset-0 z-[999] touch-none overscroll-contain"
      role="dialog"
      aria-modal="true"
      :aria-label="props.photo.alt"
      @pointerdown.stop
      @pointermove.stop
      @pointerup.stop
      @click.stop
    >
      <div
        class="absolute inset-0 cursor-zoom-out bg-black/70 transition-opacity"
        :class="entered ? 'opacity-100' : 'opacity-0'"
        :style="{ transitionDuration: `${OPEN_MS}ms` }"
        @click="dismiss"
      />
      <figure
        class="absolute cursor-zoom-out overflow-hidden rounded-xl shadow-2xl ring-1 ring-black/10 dark:ring-white/15"
        :style="figureStyle"
        @click="dismiss"
        @transitionend="onTransitionEnd"
      >
        <video
          v-if="props.photo.video"
          ref="videoEl"
          :src="props.photo.video"
          :poster="props.photo.src"
          muted
          loop
          playsinline
          preload="auto"
          :aria-label="props.photo.alt"
          class="block h-full w-full object-cover"
        />
        <img
          v-else
          :src="props.photo.src"
          :alt="props.photo.alt"
          class="block h-full w-full object-cover"
        />
      </figure>
    </div>
  </Teleport>
</template>
