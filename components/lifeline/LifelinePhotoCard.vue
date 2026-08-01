<script setup lang="ts">
import { computed, ref, type CSSProperties } from "vue"
import { cn } from "./cn"
import LifelineEventMedia from "./LifelineEventMedia.vue"
import LifelineLightbox from "./LifelineLightbox.vue"
import type { LifelineLightboxStart } from "./lifeline-lightbox-types"
import type { LifelinePhoto } from "./types"

/** Pointer travel below this is a click (opens the lightbox), not a drag. */
const CLICK_SLOP = 4
/** Fingers wobble more than mice — touch presses get extra tap room. */
const TOUCH_CLICK_SLOP = 10

/**
 * The interactive photo card, positioning-agnostic: drag moves it for
 * the session, a press without travel expands it into the lightbox.
 * Desktop floats it over the track (absolute + left/top); the vertical
 * layout drops it into normal flow.
 */
const props = withDefaults(
  defineProps<{
    photo: LifelinePhoto
    /** Resolved resting tilt, degrees. */
    rotate: number
    width: number
    /** Positioning context from the caller (e.g. "absolute"). */
    class?: string
    style?: CSSProperties
    animateIntro?: boolean
    introDelay?: number
    introDuration?: number
  }>(),
  { animateIntro: false, introDelay: 0, introDuration: 420 },
)

const cardEl = ref<HTMLElement | null>(null)
const offset = ref({ x: 0, y: 0 })
const active = ref(false)
const lightboxStart = ref<LifelineLightboxStart | null>(null)

const drag = {
  startX: 0,
  startY: 0,
  baseX: 0,
  baseY: 0,
  moved: false,
  slop: CLICK_SLOP,
}

const cardStyle = computed<CSSProperties>(() => ({
  ...props.style,
  width: `${props.width}px`,
  transform: `translate(${offset.value.x}px, ${offset.value.y}px) rotate(${props.rotate}deg)`,
}))

const innerStyle = computed<CSSProperties | undefined>(() =>
  props.animateIntro
    ? ({
        animationDelay: `${props.introDelay}ms`,
        "--lifeline-marker-fade-ms": `${props.introDuration}ms`,
      } as CSSProperties)
    : undefined,
)

function onPointerDown(event: PointerEvent) {
  // The desktop track scrubs on drag — a card drag must not reach it.
  event.stopPropagation()
  event.preventDefault()
  ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
  drag.startX = event.clientX
  drag.startY = event.clientY
  drag.baseX = offset.value.x
  drag.baseY = offset.value.y
  drag.moved = false
  drag.slop = event.pointerType === "touch" ? TOUCH_CLICK_SLOP : CLICK_SLOP
  active.value = true
}

function onPointerMove(event: PointerEvent) {
  if (!active.value) return
  const dx = event.clientX - drag.startX
  const dy = event.clientY - drag.startY
  if (Math.hypot(dx, dy) > drag.slop) drag.moved = true
  offset.value = { x: drag.baseX + dx, y: drag.baseY + dy }
}

// The card's real geometry: bounding-box center (rotation preserves it)
// plus untransformed layout size — never the rotated hull, which is what
// made the lightbox clone jump on open.
function measureCard(): LifelineLightboxStart | null {
  const el = cardEl.value
  if (!el) return null
  const rect = el.getBoundingClientRect()
  // Recover the rendered scale (hover grows the card 3%) from the rotated
  // hull: for tilt θ, hullWidth = (w·cosθ + h·sinθ)·scale.
  const w0 = el.offsetWidth
  const h0 = el.offsetHeight
  const rad = Math.abs((props.rotate * Math.PI) / 180)
  const hull = w0 * Math.cos(rad) + h0 * Math.sin(rad)
  const scale = hull > 0 ? rect.width / hull : 1
  return {
    cx: rect.left + rect.width / 2,
    cy: rect.top + rect.height / 2,
    w: w0 * scale,
    h: h0 * scale,
    mediaTime: el.querySelector("video")?.currentTime,
  }
}

function onPointerUp(event: PointerEvent) {
  ;(event.currentTarget as HTMLElement).releasePointerCapture(event.pointerId)
  active.value = false
  // A press that never travelled is a click — expand to the lightbox.
  if (!drag.moved && !lightboxStart.value) {
    lightboxStart.value = measureCard()
  }
}

// The browser claiming the gesture (a vertical pan-y scroll on touch) is
// not a click — reset without opening.
function onPointerCancel(event: PointerEvent) {
  ;(event.currentTarget as HTMLElement).releasePointerCapture(event.pointerId)
  active.value = false
  offset.value = { x: drag.baseX, y: drag.baseY }
}
</script>

<template>
  <div
    ref="cardEl"
    data-lifeline-interactive=""
    :class="
      cn(
        // pan-y keeps page scrolling alive on touch: a vertical swipe
        // starting on a card scrolls the timeline (the browser claims the
        // gesture and fires pointercancel); horizontal drags move the card.
        'group/photo pointer-events-auto cursor-grab touch-pan-y',
        active ? 'z-50 cursor-grabbing' : 'z-20 hover:z-40',
        lightboxStart && 'invisible',
        props.class,
      )
    "
    :style="cardStyle"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointercancel="onPointerCancel"
  >
    <div
      :class="
        cn(
          'overflow-hidden rounded-xl shadow-xl ring-1 ring-black/10 transition-[transform,box-shadow] duration-200 ease-out dark:ring-white/15',
          props.animateIntro && 'lifeline-marker-intro',
          active
            ? 'scale-[1.05] shadow-2xl'
            : 'group-hover/photo:scale-[1.03] group-hover/photo:shadow-2xl',
        )
      "
      :style="innerStyle"
    >
      <LifelineEventMedia
        :media="props.photo"
        class="pointer-events-none block w-full"
      />
    </div>
  </div>

  <LifelineLightbox
    v-if="lightboxStart"
    :photo="props.photo"
    :rotate="props.rotate"
    :start="lightboxStart"
    :get-home="measureCard"
    @closed="lightboxStart = null"
  />
</template>
