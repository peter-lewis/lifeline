<script setup lang="ts">
import { onBeforeUnmount, onMounted, provide, ref, watch } from "vue"
import {
  LIFELINE_HOVER_IMAGE,
  type LifelineHoverImageApi,
} from "./lifeline-hover-image"
import { clamp, snapToDevicePixel } from "./lifeline-utils"
import type { LifelineEventImage } from "./types"

/** Tweak these */
const FOLLOW_EASE = 0.16
const TILT_FACTOR = 0.14
const TILT_MAX_DEG = 7
const TILT_EASE = 0.1
const CURSOR_OFFSET_X = 24
const CURSOR_OFFSET_Y = 96

const props = defineProps<{ preload?: LifelineEventImage[] }>()

const containerEl = ref<HTMLElement | null>(null)
const imageEl = ref<HTMLImageElement | null>(null)
const videoEl = ref<HTMLVideoElement | null>(null)

const state = {
  x: 0,
  y: 0,
  targetX: 0,
  targetY: 0,
  tilt: 0,
  visible: false,
  hoverCapable: false,
  frame: 0,
}

function step() {
  const container = containerEl.value
  if (!container) return

  const dx = state.targetX - state.x
  state.x += dx * FOLLOW_EASE
  state.y += (state.targetY - state.y) * FOLLOW_EASE

  const targetTilt = clamp(dx * TILT_FACTOR, -TILT_MAX_DEG, TILT_MAX_DEG)
  state.tilt += (targetTilt - state.tilt) * TILT_EASE

  // The ease is asymptotic — it never actually arrives, so the card
  // rests on a fractional offset with a residual tilt and the browser
  // resamples it soft. Land it: snap sub-threshold deltas to done.
  if (
    Math.abs(state.targetX - state.x) < 0.1 &&
    Math.abs(state.targetY - state.y) < 0.1 &&
    Math.abs(state.tilt) < 0.05
  ) {
    state.x = state.targetX
    state.y = state.targetY
    state.tilt = 0
  }

  const rotate = state.tilt === 0 ? "" : ` rotate(${state.tilt}deg)`
  container.style.transform = `translate3d(${snapToDevicePixel(
    state.x + CURSOR_OFFSET_X,
  )}px, ${snapToDevicePixel(state.y - CURSOR_OFFSET_Y)}px, 0)${rotate}`

  if (state.visible) state.frame = requestAnimationFrame(step)
}

const api: LifelineHoverImageApi = {
  show(image) {
    const container = containerEl.value
    const img = imageEl.value
    const video = videoEl.value
    if (!state.hoverCapable || !container || !img) return

    if (image.video && video) {
      // Video takes over the card; the image element sits this one out.
      img.style.display = "none"
      video.style.display = "block"

      const targetVideo = new URL(image.video, window.location.origin).href
      if (video.src !== targetVideo) {
        video.src = targetVideo
        video.poster = image.src
      }
      video.play().catch(() => {
        // Autoplay rejection just leaves the poster frame showing.
      })

      if (!state.visible) {
        state.x = state.targetX
        state.y = state.targetY
        state.tilt = 0
      }

      state.visible = true
      container.style.opacity = "1"
      video.style.transform = "scale(1)"

      cancelAnimationFrame(state.frame)
      state.frame = requestAnimationFrame(step)
      return
    }

    if (video) {
      video.pause()
      video.style.display = "none"
    }
    img.style.display = "block"

    const targetSrc = new URL(image.src, window.location.origin).href

    if (img.src !== targetSrc) {
      // Kill the previous bitmap instantly — the browser would keep
      // showing it until the new file decodes.
      img.style.visibility = "hidden"
      img.src = targetSrc
      img.alt = image.alt

      const reveal = () => {
        // Only reveal if this image is still the requested one.
        if (img.src === targetSrc) img.style.visibility = "visible"
      }

      if (img.complete) reveal()
      else img.decode().then(reveal, reveal)
    } else {
      img.style.visibility = "visible"
    }

    if (!state.visible) {
      // Materialize at the cursor instead of flying in from the
      // last resting point.
      state.x = state.targetX
      state.y = state.targetY
      state.tilt = 0
    }

    state.visible = true
    container.style.opacity = "1"
    img.style.transform = "scale(1)"

    cancelAnimationFrame(state.frame)
    state.frame = requestAnimationFrame(step)
  },

  hide() {
    const container = containerEl.value
    const img = imageEl.value
    const video = videoEl.value
    if (!container || !img) return

    state.visible = false
    container.style.opacity = "0"
    img.style.transform = "scale(0.94)"
    if (video) {
      video.pause()
      video.style.transform = "scale(0.94)"
    }
  },
}

provide(LIFELINE_HOVER_IMAGE, api)

function onMouseMove(event: MouseEvent) {
  state.targetX = event.clientX
  state.targetY = event.clientY
}

let idleHandle = 0
let warmTimeout = 0

function warmPreload() {
  const images = props.preload
  if (!images?.length || !state.hoverCapable) return

  const warm = () => {
    images.forEach(({ src }) => {
      const image = new window.Image()
      image.src = src
    })
  }

  if (typeof window.requestIdleCallback === "function") {
    idleHandle = window.requestIdleCallback(warm)
  } else {
    warmTimeout = window.setTimeout(warm, 2000)
  }
}

onMounted(() => {
  state.hoverCapable = window.matchMedia(
    "(hover: hover) and (pointer: fine)",
  ).matches
  window.addEventListener("mousemove", onMouseMove, { passive: true })
  warmPreload()
})

watch(() => props.preload, warmPreload)

onBeforeUnmount(() => {
  window.removeEventListener("mousemove", onMouseMove)
  cancelAnimationFrame(state.frame)
  if (idleHandle) window.cancelIdleCallback?.(idleHandle)
  if (warmTimeout) window.clearTimeout(warmTimeout)
})
</script>

<template>
  <slot />
  <!--
    A cursor-following image reveal. The floating element lives at the
    provider level — it must stay outside the transformed track, since
    position: fixed resolves against the nearest transformed ancestor.
  -->
  <div
    ref="containerEl"
    aria-hidden="true"
    class="pointer-events-none fixed left-0 top-0 z-[60] opacity-0 transition-opacity duration-200 ease-out will-change-transform"
  >
    <img
      ref="imageEl"
      alt=""
      class="w-[280px] scale-95 rounded-xl shadow-2xl ring-1 ring-black/10 transition-[transform,box-shadow] duration-200 ease-out dark:ring-white/15"
      decoding="async"
    />
    <!--
      Landscape fills the same 280px card as images; portrait is capped
      by height instead, matching the floating cards' scale (180x320) so
      tall clips don't tower over the cursor.
    -->
    <video
      ref="videoEl"
      muted
      loop
      playsinline
      preload="none"
      class="max-h-[320px] w-auto max-w-[280px] scale-95 rounded-xl shadow-2xl ring-1 ring-black/10 transition-[transform,box-shadow] duration-200 ease-out dark:ring-white/15"
      style="display: none"
    />
  </div>
</template>
