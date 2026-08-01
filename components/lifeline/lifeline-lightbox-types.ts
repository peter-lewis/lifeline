/**
 * The card's true geometry at handoff time. Center comes from the
 * bounding box (rotation about center preserves it); width/height are
 * the untransformed layout size — the bounding box of a tilted card is
 * its axis-aligned hull, which is larger than the card and lands the
 * clone visibly off.
 */
export interface LifelineLightboxStart {
  cx: number
  cy: number
  w: number
  h: number
  /** Playback position of the card's video, for a seamless swap. */
  mediaTime?: number
}
