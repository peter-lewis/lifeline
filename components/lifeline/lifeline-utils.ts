import type {
  LifelineEvent,
  LifelineFilterKey,
  LifelineMarker,
  LifelineTrack,
} from "./types"

/**
 * Which of a marker's events currently count as on screen. Passed down by
 * the track filter so a year's measured size follows what is actually
 * being shown; omitted everywhere else, which means "all of them".
 */
export type LifelineEventVisibility = (event: LifelineEvent) => boolean

/** Whether a given legend key is currently switched on. */
export type LifelineTrackVisibility = (key: LifelineFilterKey) => boolean

export const LIFELINE_MOBILE_BREAKPOINT = 768

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

/**
 * A composited layer resting on a fractional offset resamples its whole
 * subtree — text goes soft. Snapping to the device pixel grid (not whole
 * CSS pixels) keeps half-pixel steps on retina, so motion stays smooth.
 */
export function snapToDevicePixel(value: number) {
  const dpr = window.devicePixelRatio || 1
  return Math.round(value * dpr) / dpr
}

export function countVisibleEvents(
  marker: LifelineMarker,
  isVisible?: LifelineEventVisibility,
) {
  if (!isVisible) return marker.events.length
  return marker.events.reduce(
    (total, event) => total + (isVisible(event) ? 1 : 0),
    0,
  )
}

/**
 * Logos, photographs and faces annotate a year's events, so they go when
 * those events go. Filter every event out of 2003 and its AMD badge and
 * its portraits have nothing left to annotate — they would just be
 * floating beside an empty year.
 *
 * A heuristic standing in for a `track` on each annotation itself, which
 * the data does not carry. A year holding annotations and no events at
 * all has nothing to key off, so it keeps them.
 */
export function showMarkerAnnotations(
  marker: LifelineMarker,
  isVisible?: LifelineEventVisibility,
) {
  if (!isVisible || marker.events.length === 0) return true
  return marker.events.some(isVisible)
}

/**
 * A badge or photograph carrying its own `track` follows that track
 * directly — switch Tech off and every hardware logo goes, even in a year
 * whose Work events are still on screen. One with no track falls back to
 * the year-level heuristic.
 */
export function isAnnotationVisible(
  annotationTrack: LifelineTrack | undefined,
  marker: LifelineMarker,
  isVisible?: LifelineEventVisibility,
  isTrackOn?: LifelineTrackVisibility,
) {
  if (annotationTrack && isTrackOn) return isTrackOn(annotationTrack)
  return showMarkerAnnotations(marker, isVisible)
}

export function visibleMarkerCompanies(
  marker: LifelineMarker,
  isVisible?: LifelineEventVisibility,
  isTrackOn?: LifelineTrackVisibility,
) {
  return (marker.companies ?? []).filter((company) =>
    isAnnotationVisible(company.track, marker, isVisible, isTrackOn),
  )
}

export function visibleMarkerPhotos(
  marker: LifelineMarker,
  isVisible?: LifelineEventVisibility,
  isTrackOn?: LifelineTrackVisibility,
) {
  return (marker.photos ?? []).filter((photo) =>
    isAnnotationVisible(photo.track, marker, isVisible, isTrackOn),
  )
}

export function hasMarkerContent(
  marker: LifelineMarker,
  isVisible?: LifelineEventVisibility,
  isTrackOn?: LifelineTrackVisibility,
  showPeople = true,
) {
  if (countVisibleEvents(marker, isVisible) > 0) return true
  if (visibleMarkerCompanies(marker, isVisible, isTrackOn).length > 0) return true

  // The faces are their own thread: they hold a year open on their own
  // while influences are on, and take it with them when they go.
  return showPeople && hasMarkerPeople(marker)
}

export function hasMarkerPeople(marker: LifelineMarker) {
  return (marker.mentors?.length ?? 0) > 0 || (marker.met?.length ?? 0) > 0
}

export function getMarkerHeight(marker: LifelineMarker, nextYear?: number) {
  const hasContent = hasMarkerContent(marker)
  const hasPeople = hasMarkerPeople(marker)

  if (!hasContent) return 48

  const peopleOnly =
    hasPeople &&
    marker.events.length === 0 &&
    (marker.companies?.length ?? 0) === 0

  let height = 96

  if (marker.companies?.length) height += 28
  height += marker.events.length * 44

  if (peopleOnly) height += 88
  else if (hasPeople) height += 108

  if (!nextYear) return Math.min(520, Math.max(peopleOnly ? 148 : 188, height))

  const gap = Math.max(1, nextYear - marker.year)
  height += Math.min(32, gap * 3)

  return Math.min(520, Math.max(peopleOnly ? 148 : 188, height))
}

export function getMarkerWidth(
  marker: LifelineMarker,
  nextYear?: number,
  isVisible?: LifelineEventVisibility,
  isTrackOn?: LifelineTrackVisibility,
  showPeople = true,
) {
  const hasContent = hasMarkerContent(marker, isVisible, isTrackOn, showPeople)
  const hasPeople = showPeople && hasMarkerPeople(marker)

  if (!nextYear) return hasContent ? 360 : 80
  if (!hasContent) return 80

  const peopleOnly =
    hasPeople &&
    countVisibleEvents(marker, isVisible) === 0 &&
    visibleMarkerCompanies(marker, isVisible, isTrackOn).length === 0

  if (peopleOnly) return 220

  const gap = Math.max(1, nextYear - marker.year)
  return Math.min(420, Math.max(290, gap * 36))
}
