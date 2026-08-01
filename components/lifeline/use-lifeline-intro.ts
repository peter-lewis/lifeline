import { computed, onBeforeUnmount, ref } from "vue"
import {
  getTransitionMarkerFadeDuration,
  LIFELINE_FAST_MARKER_FADE_MS,
  timeAtTrackProgress,
  trackProgressAtTime,
} from "./lifeline-intro-timing"

/** Tweak these */
export const LIFELINE_LABELS_MS = 600
export const LIFELINE_RAIL_MS = 3200
/**
 * Track length (px on desktop, tall lifelines on mobile) the base rail
 * duration was tuned for — roughly a 40-year personal lifeline. Longer
 * tracks slow the sweep sublinearly so dense timelines stay readable,
 * capped so a 250-year nation doesn't become a screensaver.
 */
export const LIFELINE_REFERENCE_TRACK = 9000
export const LIFELINE_RAIL_MAX_MS = 7200
export const LIFELINE_RAIL_SCALE_POWER = 0.45
/**
 * Keep fade stretching subtle — long fades lag behind the sweeping
 * line and read as out of sync.
 */
export const LIFELINE_FADE_SCALE_MAX = 1.5

export function useLifelineIntro(markerWidths: () => number[]) {
  // Skip straight to the settled end state for users who prefer reduced motion.
  const shouldPlay =
    typeof window === "undefined" ||
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  const isPlaying = ref(true)
  const isComplete = ref(false)
  let introTimeout = 0

  const totalMarkersWidth = computed(() =>
    markerWidths().reduce((sum, width) => sum + width, 0),
  )

  const railDuration = computed(() => {
    if (totalMarkersWidth.value <= LIFELINE_REFERENCE_TRACK) {
      return LIFELINE_RAIL_MS
    }

    const scale = Math.pow(
      totalMarkersWidth.value / LIFELINE_REFERENCE_TRACK,
      LIFELINE_RAIL_SCALE_POWER,
    )
    return Math.min(LIFELINE_RAIL_MAX_MS, Math.round(LIFELINE_RAIL_MS * scale))
  })

  // Stretch each marker's fade with the sweep so dense timelines bloom
  // in a trailing wave instead of flickering past.
  const fadeScale = computed(() =>
    Math.min(LIFELINE_FADE_SCALE_MAX, railDuration.value / LIFELINE_RAIL_MS),
  )

  const introDuration = computed(
    () =>
      railDuration.value +
      Math.round(LIFELINE_FAST_MARKER_FADE_MS * fadeScale.value),
  )

  function getTrackProgressAtTime(elapsedMs: number) {
    if (!shouldPlay || totalMarkersWidth.value <= 0) {
      return Math.min(elapsedMs / railDuration.value, 1)
    }

    return trackProgressAtTime(elapsedMs, markerWidths(), railDuration.value)
  }

  function getMarkerDelay(index: number) {
    if (!shouldPlay || totalMarkersWidth.value <= 0) return 0

    const widths = markerWidths()
    const offset = widths
      .slice(0, index)
      .reduce((sum, width) => sum + width, 0)

    return timeAtTrackProgress(
      offset / totalMarkersWidth.value,
      widths,
      railDuration.value,
    )
  }

  function getMarkerFadeDuration(index: number) {
    return Math.round(getTransitionMarkerFadeDuration(index) * fadeScale.value)
  }

  function completeIntro() {
    isComplete.value = true
  }

  function startIntroTimer() {
    window.clearTimeout(introTimeout)
    isPlaying.value = true
    isComplete.value = false

    introTimeout = window.setTimeout(() => {
      isPlaying.value = false
    }, introDuration.value)
  }

  onBeforeUnmount(() => window.clearTimeout(introTimeout))

  return {
    shouldPlay,
    isPlaying,
    isComplete,
    labelsDuration: LIFELINE_LABELS_MS,
    railDuration,
    getTrackProgressAtTime,
    getMarkerDelay,
    getMarkerFadeDuration,
    startIntroTimer,
    completeIntro,
  }
}
