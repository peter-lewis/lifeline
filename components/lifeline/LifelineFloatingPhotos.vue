<script setup lang="ts">
import { computed } from "vue"
import LifelineFloatingPhotoCard from "./LifelineFloatingPhotoCard.vue"
import { getLifelineEventTrack } from "./lifeline-event-utils"
import { isLifelineTrackMuted, useLifelineTracks } from "./lifeline-tracks"
import { visibleMarkerPhotos } from "./lifeline-utils"
import type { LifelineEvent, LifelineMarker, LifelinePhoto } from "./types"

/** Tweak these */
const CARD_WIDTH = 180
/** Matches the events column's pt-6 — cards align with the first event's text. */
const EVENT_TOP = 24
/**
 * How far along a card the next one in the stack starts — 0.6 leaves
 * a solid margin of every card visible under its neighbor.
 */
const STACK_OVERLAP = 0.6
/**
 * Stacks cascade diagonally: the last card sits level with the event
 * text and each one before it hangs this much lower, so neighbors
 * overlap corner-to-corner instead of side-by-side.
 */
const CASCADE_Y = 170
/** Event text column: max-w-[18rem] plus breathing room. */
const TEXT_ZONE = 288 + 24

const props = withDefaults(
  defineProps<{
    markers: LifelineMarker[]
    offsets: number[]
    widths: number[]
    animateIntro?: boolean
    getIntroDelay?: (markerIndex: number) => number
    getIntroDuration?: (markerIndex: number) => number
  }>(),
  { animateIntro: false },
)

const tracks = useLifelineTracks()

const isEventVisible = (event: LifelineEvent) =>
  !isLifelineTrackMuted(tracks, getLifelineEventTrack(event))

interface PlacedPhoto {
  key: string
  photo: LifelinePhoto
  stackIndex: number
  stackCount: number
  x: number
  defaultY: number
  width: number
  introDelay: number
  introDuration: number
  visible: boolean
}

const placed = computed<PlacedPhoto[]>(() => {
  const { markers, offsets, widths } = props
  const at = (list: number[], index: number) => list[index] ?? 0
  const trackEnd =
    offsets.length > 0
      ? at(offsets, offsets.length - 1) + at(widths, widths.length - 1)
      : 0

  // Intro sync: a card fades in when the rail tip reaches it, i.e. on the
  // schedule of the marker whose slot its center sits over — which is
  // usually years past its anchor.
  const markerIndexAt = (x: number) => {
    for (let index = offsets.length - 1; index >= 0; index--) {
      if (at(offsets, index) <= x) return index
    }
    return 0
  }

  const result: PlacedPhoto[] = []

  markers.forEach((marker, index) => {
    const markerPhotos = marker.photos ?? []
    if (!markerPhotos.length) return

    // A photograph follows its own track, or failing that the year's
    // events. Cards stay placed either way and fade instead of vanishing —
    // dropping them from the layout would shuffle the stack underneath.
    const shown = new Set(
      visibleMarkerPhotos(marker, isEventVisible, (track) =>
        tracks === null || tracks.isEnabled(track),
      ),
    )

    // The card's free run: after this year's own text column, up to the
    // start of the next year that has text of its own.
    const zoneStart =
      at(offsets, index) + (marker.events.length > 0 ? TEXT_ZONE : 0)
    const nextTextIndex = markers.findIndex(
      (candidate, candidateIndex) =>
        candidateIndex > index && candidate.events.length > 0,
    )
    const zoneEnd =
      nextTextIndex === -1 ? trackEnd : at(offsets, nextTextIndex)

    // Stacks center as a group so a lone card sits in the middle of the
    // gap and a pile spreads evenly around it. Each card starts
    // STACK_OVERLAP of the way along the one beneath it.
    const steps: number[] = []
    let fan = 0
    for (const stacked of markerPhotos) {
      steps.push(fan)
      fan += (stacked.width ?? CARD_WIDTH) * STACK_OVERLAP
    }
    const photoCount = markerPhotos.length
    const lastPhoto = markerPhotos[photoCount - 1]
    const groupWidth =
      at(steps, steps.length - 1) + (lastPhoto?.width ?? CARD_WIDTH)

    markerPhotos.forEach((photo, photoIndex) => {
      const width = photo.width ?? CARD_WIDTH
      // Default home: centered in the text-free run between this year's
      // events and the next year that has text — comfortably away from
      // both columns.
      const x =
        photo.x !== undefined
          ? at(offsets, index) + photo.x * at(widths, index)
          : Math.max(
              zoneStart,
              zoneStart +
                (zoneEnd - zoneStart - groupWidth) / 2 +
                at(steps, photoIndex),
            )
      const introIndex = markerIndexAt(x + width / 2)

      result.push({
        key: `${marker.id}-${photoIndex}`,
        photo,
        stackIndex: photoIndex,
        stackCount: photoCount,
        x,
        // The last card of a stack sits level with the event text;
        // earlier cards hang progressively lower — the diagonal.
        defaultY: EVENT_TOP + (photoCount - 1 - photoIndex) * CASCADE_Y,
        width,
        introDelay: props.getIntroDelay?.(introIndex) ?? 0,
        introDuration: props.getIntroDuration?.(introIndex) ?? 420,
        visible: shown.has(photo),
      })
    })
  })

  return result
})
</script>

<template>
  <!--
    Always-visible media scattered over the timeline — anchored to their
    marker's slot, tilted and overlapping like photos in a notebook.
    Rendered inside the transformed track, so they ride the scroll;
    dragging repositions a card for the session.
  -->
  <div aria-hidden="true" class="pointer-events-none absolute inset-0">
    <LifelineFloatingPhotoCard
      v-for="item in placed"
      :key="item.key"
      :photo="item.photo"
      :stack-index="item.stackIndex"
      :stack-count="item.stackCount"
      :x="item.x"
      :default-y="item.defaultY"
      :width="item.width"
      :animate-intro="props.animateIntro"
      :intro-delay="item.introDelay"
      :intro-duration="item.introDuration"
      :visible="item.visible"
    />
  </div>
</template>
