<script setup lang="ts">
import { computed, watch, type CSSProperties } from "vue"
import { cn } from "./cn"
import LifelineFloatingPhotos from "./LifelineFloatingPhotos.vue"
import LifelineHoverImageProvider from "./LifelineHoverImageProvider.vue"
import LifelineMarkerColumn from "./LifelineMarkerColumn.vue"
import LifelineStickyLabels from "./LifelineStickyLabels.vue"
import {
  getLifelineEventImage,
  getLifelineEventTrack,
} from "./lifeline-event-utils"
import { LIFELINE_STICKY_SHIELD_WIDTH } from "./lifeline-labels-shared"
import {
  arePeopleMuted,
  isLifelineTrackMuted,
  useLifelineTracks,
} from "./lifeline-tracks"
import { getMarkerWidth } from "./lifeline-utils"
import { useLifelineIntro } from "./use-lifeline-intro"
import { useLifelineScroll } from "./use-lifeline-scroll"
import type {
  LifelineEvent,
  LifelineEventImage,
  LifelineFilterKey,
  LifelineProps,
} from "./types"

const props = withDefaults(defineProps<LifelineProps>(), {
  title: "Lifeline",
  mode: "auto",
})

const tracks = useLifelineTracks()

const isEventVisible = (event: LifelineEvent) =>
  !isLifelineTrackMuted(tracks, getLifelineEventTrack(event))

const isTrackOn = (key: LifelineFilterKey) =>
  tracks === null || tracks.isEnabled(key)

// A year measures by what it is showing. Filter every event and badge out
// of one and it falls to the same 80px an empty year gets, so the timeline
// contracts around the thread still on screen rather than holding the gaps
// open. Both predicates go in, so the width and what is drawn agree.
const widths = computed(() =>
  props.markers.map((marker, index) =>
    getMarkerWidth(
      marker,
      props.markers[index + 1]?.year,
      isEventVisible,
      isTrackOn,
      !arePeopleMuted(tracks),
    ),
  ),
)

// Left edge of each marker's slot within the track — anchors for the
// floating photo cards.
const offsets = computed(() => {
  const result: number[] = []
  let sum = 0
  for (const width of widths.value) {
    result.push(sum)
    sum += width
  }
  return result
})

const hoverImages = computed(() => {
  const images: LifelineEventImage[] = []
  for (const marker of props.markers) {
    for (const event of marker.events) {
      const image = getLifelineEventImage(event)
      if (image) images.push(image)
    }
  }
  return images
})

const intro = useLifelineIntro(() => widths.value)
const isIntroAnimating = computed(() => intro.shouldPlay && intro.isPlaying.value)

const {
  sectionEl,
  trackEl,
  labelsEl,
  setMarkerRef,
  isLayoutReady,
  isEmbed,
  introArmed,
  holdAnchorThroughResize,
} = useLifelineScroll(() => props.markers.length, {
  mode: () => props.mode,
  introLocked: () => isIntroAnimating.value,
  introAnimating: () => isIntroAnimating.value,
  introSkipped: () => !intro.shouldPlay,
  introRailMs: () => intro.railDuration.value,
  introGetTrackProgress: intro.getTrackProgressAtTime,
  onIntroScrollStart: intro.startIntroTimer,
  onIntroSettleComplete: intro.completeIntro,
})

// Embedded, the open waits for the module to come into view: the marker
// fades are CSS animations that start the moment their class lands, so
// applying it early would spend them below the fold.
const introWaitingInView = computed(
  () => isEmbed.value && intro.shouldPlay && !introArmed.value,
)
const showIntro = computed(
  () => isIntroAnimating.value && isLayoutReady.value && !introWaitingInView.value,
)

const trackWidth = computed(
  () =>
    LIFELINE_STICKY_SHIELD_WIDTH +
    widths.value.reduce((sum, width) => sum + width, 0),
)

/**
 * Must match the column's width transition in the template — the anchor
 * releases the rail the moment the columns stop moving.
 */
const COLLAPSE_MS = 420

// Both arrays go through: the anchor works out where the rail has to land
// by summing them, rather than measuring a track that is mid-transition.
watch(widths, (next, prev) =>
  holdAnchorThroughResize(COLLAPSE_MS, prev ?? next, next),
)

const introStyle = computed<CSSProperties | undefined>(() =>
  showIntro.value
    ? ({
        "--lifeline-labels-ms": `${intro.labelsDuration}ms`,
        "--lifeline-rail-ms": `${intro.railDuration.value}ms`,
      } as CSSProperties)
    : undefined,
)
</script>

<template>
  <section
    ref="sectionEl"
    :data-lifeline-mode="isEmbed ? 'embed' : 'page'"
    :tabindex="isEmbed ? 0 : undefined"
    :class="
      cn(
        'relative h-full min-h-0 select-none overflow-hidden [&_a]:cursor-pointer',
        // `pan-y` lets the browser start a vertical page scroll on the
        // first frame instead of waiting on the JS axis lock; horizontal
        // panning stays ours.
        isEmbed &&
          'touch-pan-y focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        // Hold it blank rather than showing a settled timeline that then
        // resets itself to play the intro.
        (!isLayoutReady || introWaitingInView) && 'invisible',
        props.class,
      )
    "
    :aria-label="props.title"
    :style="introStyle"
  >
    <LifelineHoverImageProvider :preload="hoverImages">
      <!--
        Centered — but `safe center` where the browser understands it. A
        track taller than its box otherwise overflows equally top and
        bottom, and since the section clips, the first thing lost is the
        row nearest the top: the Age/Years label column and every year
        label. `safe` falls back to start-alignment exactly in that case,
        so the header survives and only the tail of a long column clips.

        Applied in BOTH modes, not just embed. Page mode is just as able
        to be short — a laptop window under ~720px tall with a dense
        timeline clipped the entire header row, which is the one part of
        the chrome you cannot afford to lose. Browsers without `safe`
        simply keep the `items-center` class.
      -->
      <div
        class="flex h-full items-center overflow-hidden"
        :style="{ alignItems: 'safe center' }"
      >
        <div
          ref="trackEl"
          class="relative flex w-max items-start will-change-transform [--lifeline-people-top:calc(14.5rem+40px)] [--lifeline-rail:5rem]"
          :style="{ width: `${trackWidth}px` }"
        >
          <!--
            LIFELINE_STICKY_SHIELD_WIDTH reserves this column at the head
            of the track, and the column has to actually paint it: once
            the track scrolls, marker text passes underneath and would
            otherwise read straight through "Age" and "Years".

            The colour transition is not decoration either: without it the
            shield snaps between the two while the page behind it is still
            crossfading, which flashes a hard box for the length of a
            theme switch. 300ms is what LifelineShell fades on, so the two
            move as one.
          -->
          <div
            ref="labelsEl"
            class="lifeline-labels shrink-0 bg-white transition-colors duration-300 will-change-transform dark:bg-black"
            :style="{ width: `${LIFELINE_STICKY_SHIELD_WIDTH}px` }"
          >
            <div :class="showIntro && 'lifeline-labels-intro'">
              <LifelineStickyLabels />
            </div>
          </div>

          <div class="relative">
            <div
              aria-hidden="true"
              class="pointer-events-none absolute inset-x-0 top-[var(--lifeline-rail)] h-px overflow-hidden"
            >
              <div
                :class="
                  cn(
                    'h-px w-full border-t border-dashed border-zinc-300 transition-colors duration-300 dark:border-zinc-800',
                    showIntro && 'lifeline-rail-intro',
                  )
                "
              />
            </div>

            <div class="relative flex items-start">
              <LifelineMarkerColumn
                v-for="(marker, index) in props.markers"
                :key="marker.id"
                :ref="(node) => setMarkerRef(index, (node as any)?.$el ?? null)"
                :marker="marker"
                :birth-year="props.birthYear"
                :min-width="widths[index] ?? 0"
                :animate-intro="showIntro"
                :intro-delay="intro.getMarkerDelay(index)"
                :intro-duration="intro.getMarkerFadeDuration(index)"
              />
            </div>

            <LifelineFloatingPhotos
              :markers="props.markers"
              :offsets="offsets"
              :widths="widths"
              :animate-intro="showIntro"
              :get-intro-delay="intro.getMarkerDelay"
              :get-intro-duration="intro.getMarkerFadeDuration"
            />
          </div>
        </div>
      </div>
    </LifelineHoverImageProvider>
  </section>
</template>
