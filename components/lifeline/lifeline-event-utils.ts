import type {
  LifelineEvent,
  LifelineEventEffect,
  LifelineEventImage,
  LifelineEventSegment,
  LifelineTrack,
} from "./types"

/** Tailwind class per track — shared by the event dots and the legend. */
export const LIFELINE_TRACK_DOT: Record<LifelineTrack, string> = {
  tech: "bg-amber-500",
  work: "bg-blue-500",
  life: "bg-emerald-500",
}

/**
 * The legend keys one more thing than the event dots do: the people row.
 * Influences get violet so the marker beside a face can't be mistaken for
 * the blue "Work" dot sitting a few pixels away in the same column.
 */
export const LIFELINE_INFLUENCE_DOT = "bg-violet-500"

export const LIFELINE_LEGEND_DOT: Record<string, string> = {
  ...LIFELINE_TRACK_DOT,
  influence: LIFELINE_INFLUENCE_DOT,
}

export function getEventContent(
  event: LifelineEvent,
): string | LifelineEventSegment[] {
  if (typeof event === "object" && !Array.isArray(event) && "text" in event) {
    return event.text
  }

  return event
}

export function getLifelineEventImage(
  event: LifelineEvent,
): LifelineEventImage | undefined {
  if (typeof event === "object" && !Array.isArray(event) && "image" in event) {
    return event.image
  }

  return undefined
}

export function getLifelineEventEffect(
  event: LifelineEvent,
): LifelineEventEffect | undefined {
  if (typeof event === "object" && !Array.isArray(event) && "effect" in event) {
    return event.effect
  }

  return undefined
}

export function getLifelineEventTrack(
  event: LifelineEvent,
): LifelineTrack | undefined {
  if (typeof event === "object" && !Array.isArray(event) && "track" in event) {
    return event.track
  }

  return undefined
}

export function getLifelineEventKey(event: LifelineEvent, index: number) {
  const content = getEventContent(event)

  if (typeof content === "string") return `${index}-${content}`

  return `${index}-${content.map((segment) => segment.value).join("")}`
}
