<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, watch, type CSSProperties } from "vue"
import { cn } from "./cn"
import LifelineVerticalEntry from "./LifelineVerticalEntry.vue"
import { getLifelineEventImage } from "./lifeline-event-utils"
import { getMarkerHeight } from "./lifeline-utils"
import { useLifelineIntro } from "./use-lifeline-intro"
import { useLifelineVerticalScroll } from "./use-lifeline-vertical-scroll"
import type { LifelineProps } from "./types"

const GRID_CLASS = "grid grid-cols-[2.5rem_1rem_1fr] gap-x-3"
const RAIL_LEFT = "calc(2.5rem + 0.75rem + 0.5rem)"

/**
 * Above this many entries the delay-armed intro fades would promote every
 * entry to a compositor layer at once and crash mobile Safari's
 * compositor. Long timelines fade entries in as they enter the viewport
 * during the auto-scroll instead — same look, but only a handful of live
 * animations at any moment.
 */
const MAX_ARMED_ENTRIES = 80

const props = withDefaults(defineProps<LifelineProps>(), {
  title: "Lifeline",
  mode: "auto",
})

// Only an explicit `mode` embeds the vertical layout. `"auto"` measures
// scrollability on desktop, but the mobile layout *is* a vertical
// scroller inside a scrolling stage, so that test would read every
// full-page timeline as embedded and drop its intro.
const isEmbed = computed(() => props.mode === "embed")

const heights = computed(() =>
  props.markers.map((marker, index) =>
    getMarkerHeight(marker, props.markers[index + 1]?.year),
  ),
)

const intro = useLifelineIntro(() => heights.value)
const isIntroAnimating = computed(() => intro.shouldPlay && intro.isPlaying.value)

const { sectionEl, setEntryRef, isLayoutReady } = useLifelineVerticalScroll(
  () => props.markers.length,
  {
    isEmbed: () => isEmbed.value,
    introLocked: () => isIntroAnimating.value,
    introAnimating: () => isIntroAnimating.value,
    // Embedded, the sweep would play out unseen below the fold — and lock
    // the module's own scroller while doing it.
    introSkipped: () => !intro.shouldPlay || isEmbed.value,
    introRailMs: () => intro.railDuration.value,
    introGetTrackProgress: intro.getTrackProgressAtTime,
    onIntroScrollStart: intro.startIntroTimer,
    onIntroSettleComplete: intro.completeIntro,
  },
)

const showIntro = computed(
  () => isIntroAnimating.value && isLayoutReady.value && !isEmbed.value,
)
const revealOnScroll = computed(() => props.markers.length > MAX_ARMED_ENTRIES)
const animateEntries = computed(() => showIntro.value && !revealOnScroll.value)

const introStyle = computed<CSSProperties | undefined>(() =>
  showIntro.value
    ? ({
        "--lifeline-labels-ms": `${intro.labelsDuration}ms`,
        "--lifeline-rail-ms": `${intro.railDuration.value}ms`,
      } as CSSProperties)
    : undefined,
)

// Warm the event media posters during idle — the tap-to-open lightbox
// measures its frame from these, and a cold fetch at tap time reads as lag.
let idleHandle = 0
let warmTimeout = 0

onMounted(() => {
  const sources: string[] = []
  for (const marker of props.markers) {
    for (const event of marker.events) {
      const image = getLifelineEventImage(event)
      if (image) sources.push(image.src)
    }
  }
  if (sources.length === 0) return

  const warm = () => {
    sources.forEach((src) => {
      const image = new window.Image()
      image.src = src
    })
  }

  if (typeof window.requestIdleCallback === "function") {
    idleHandle = window.requestIdleCallback(warm)
  } else {
    warmTimeout = window.setTimeout(warm, 2000)
  }
})

/**
 * Rail-synced fades for long timelines: entries render hidden and each
 * one fades in the moment the rail tip (--lifeline-intro-progress,
 * written every frame by the intro scroll) crosses its position —
 * desktop's choreography, but each entry drops its animation (and
 * compositor layer) as soon as its fade finishes.
 */
let revealFrame = 0
let onAnimationEnd: ((event: AnimationEvent) => void) | undefined
let revealSection: HTMLElement | null = null

function stopReveal() {
  cancelAnimationFrame(revealFrame)
  revealFrame = 0
  if (revealSection && onAnimationEnd) {
    revealSection.removeEventListener("animationend", onAnimationEnd)
  }
  onAnimationEnd = undefined
  revealSection = null
}

watch(
  [showIntro, revealOnScroll],
  () => {
    stopReveal()
    if (!showIntro.value || !revealOnScroll.value) return

    const section = sectionEl.value
    const ol = section?.querySelector("ol")
    if (!section || !ol) return

    revealSection = section
    const entries = Array.from(ol.children) as HTMLElement[]
    const targets = entries.map(
      (li) => li.firstElementChild as HTMLElement | null,
    )

    onAnimationEnd = (event: AnimationEvent) => {
      if (event.animationName !== "lifeline-marker-in") return
      ;(event.target as HTMLElement).classList.remove("lifeline-marker-intro")
    }
    section.addEventListener("animationend", onAnimationEnd)

    let next = 0
    const tick = () => {
      const progress = parseFloat(
        section.style.getPropertyValue("--lifeline-intro-progress") || "0",
      )
      const tip = progress * ol.offsetHeight

      while (next < entries.length && (entries[next]?.offsetTop ?? 0) <= tip) {
        const el = targets[next]
        if (el) {
          el.classList.remove("opacity-0")
          el.classList.add("lifeline-marker-intro")
        }
        next++
      }

      if (next < entries.length) revealFrame = requestAnimationFrame(tick)
    }
    revealFrame = requestAnimationFrame(tick)
  },
  { flush: "post" },
)

onBeforeUnmount(() => {
  stopReveal()
  if (idleHandle) window.cancelIdleCallback?.(idleHandle)
  if (warmTimeout) window.clearTimeout(warmTimeout)
})
</script>

<template>
  <article
    ref="sectionEl"
    :aria-label="props.title"
    :class="
      cn(
        'relative select-none px-6 pb-10 pt-4 [&_a]:cursor-pointer',
        !isLayoutReady && 'invisible',
      )
    "
    :style="introStyle"
  >
    <div
      :class="
        cn(`${GRID_CLASS} mb-6 items-end`, showIntro && 'lifeline-labels-intro')
      "
    >
      <p
        class="text-right text-[11px] font-medium uppercase leading-4 tracking-[0.08em] text-zinc-500 transition-colors duration-300 dark:text-zinc-600"
      >
        Age
      </p>
      <div aria-hidden="true" />
      <p
        class="text-[11px] font-medium uppercase leading-5 tracking-[0.08em] text-zinc-500 transition-colors duration-300 dark:text-zinc-600"
      >
        Years
      </p>
    </div>

    <div class="relative">
      <div
        aria-hidden="true"
        class="pointer-events-none absolute bottom-0 top-0 overflow-hidden -translate-x-1/2"
        :style="{ left: RAIL_LEFT, width: '1px' }"
      >
        <div
          :class="
            cn(
              'h-full w-px border-l border-dashed border-zinc-300 transition-colors duration-300 dark:border-zinc-800',
              showIntro && 'lifeline-rail-intro-vertical',
            )
          "
        />
      </div>

      <ol class="relative">
        <LifelineVerticalEntry
          v-for="(marker, index) in props.markers"
          :key="marker.id"
          :ref="(node) => setEntryRef(index, (node as any)?.$el ?? null)"
          :marker="marker"
          :birth-year="props.birthYear"
          :animate-intro="animateEntries"
          :reveal-pending="showIntro && revealOnScroll"
          :intro-delay="intro.getMarkerDelay(index)"
          :intro-duration="intro.getMarkerFadeDuration(index)"
        />
      </ol>
    </div>
  </article>
</template>
