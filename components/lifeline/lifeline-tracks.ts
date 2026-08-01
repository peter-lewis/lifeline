import { inject, type InjectionKey } from "vue"
import { getLifelineEventTrack } from "./lifeline-event-utils"
import type { LifelineEvent, LifelineFilterKey, LifelineTrack } from "./types"

/** Legend order, so the year's summary dots always read the same way. */
export const LIFELINE_TRACK_ORDER: LifelineFilterKey[] = [
  "tech",
  "work",
  "life",
  "influence",
]

/**
 * Track filtering, bridged the same way the theme, hover image and
 * fireworks are: the timeline reads it, the legend writes it, and neither
 * one imports the other.
 *
 * Optional on purpose. `useLifelineTracks` defaults to `null`, and every
 * call site treats null as "everything is on" — so installing the registry
 * without ever mounting the provider yields the plain unfiltered timeline.
 */
export interface LifelineTracksApi {
  isEnabled: (key: LifelineFilterKey) => boolean
  toggle: (key: LifelineFilterKey) => void
}

export const LIFELINE_TRACKS: InjectionKey<LifelineTracksApi> =
  Symbol("lifeline-tracks")

export function useLifelineTracks() {
  return inject(LIFELINE_TRACKS, null)
}

/**
 * A muted event keeps its dot and drops everything else. Shared by the
 * horizontal column and the vertical entry so the two layouts can't drift
 * on what "off" means.
 */
export function isLifelineTrackMuted(
  tracks: LifelineTracksApi | null,
  track: LifelineTrack | undefined,
) {
  return Boolean(track) && tracks !== null && !tracks.isEnabled(track!)
}

/**
 * The faces are a thread of their own rather than a subdivision of work —
 * a father who taught you to build a PC and an owner who paid for your
 * college do not belong to the same column. One switch covers them all.
 */
export function arePeopleMuted(tracks: LifelineTracksApi | null) {
  return tracks !== null && !tracks.isEnabled("influence")
}

/**
 * Which tracks this year is hiding — one entry per track, however many
 * events it swallowed.
 *
 * A muted event leaves no row of its own, so a year that dropped five of
 * them would otherwise vanish without trace. Instead the year keeps a
 * single dot per track beside its number: enough to show something is
 * there, without five blank lines standing in for it.
 */
/**
 * Every thread this year carries, switched on or off. The summary dots
 * mount on this and fold on `getMutedMarkerTracks`, so they can animate in
 * and out instead of appearing from nowhere.
 */
export function getMarkerTracks(
  events: LifelineEvent[],
  hasPeople = false,
): LifelineFilterKey[] {
  const present = new Set<LifelineFilterKey>()
  for (const event of events) {
    const track = getLifelineEventTrack(event)
    if (track) present.add(track)
  }
  if (hasPeople) present.add("influence")

  return LIFELINE_TRACK_ORDER.filter((key) => present.has(key))
}

export function getMutedMarkerTracks(
  events: LifelineEvent[],
  tracks: LifelineTracksApi | null,
  hasPeople = false,
) {
  if (!tracks) return []

  const muted = new Set<LifelineFilterKey>()
  for (const event of events) {
    const track = getLifelineEventTrack(event)
    if (track && !tracks.isEnabled(track)) muted.add(track)
  }
  if (hasPeople && arePeopleMuted(tracks)) muted.add("influence")

  return LIFELINE_TRACK_ORDER.filter((key) => muted.has(key))
}
