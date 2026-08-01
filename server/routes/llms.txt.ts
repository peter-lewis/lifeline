import { getEventContent } from "~/components/lifeline/lifeline-event-utils"
import type { LifelineEvent } from "~/components/lifeline/types"
import { peterLifeline } from "~/lib/peter"

/**
 * A plain-text biography at /llms.txt.
 *
 * "Who is Peter Lewis" is increasingly answered by assistants rather than
 * by a results page, and those crawlers mostly do not execute JavaScript.
 * They get the same `markers` array the timeline and `LifelineStatic`
 * read — generated per request rather than checked in, so adding a year
 * to `lib/peter.ts` updates this with no second step to forget.
 */

/** Events are `string | LifelineEventSegment[] | {text}`; flatten to prose. */
function eventText(event: LifelineEvent): string {
  const content = getEventContent(event)

  if (typeof content === "string") return content

  return content.map((segment) => segment.value).join("")
}

export default defineEventHandler((event) => {
  const lines: string[] = [
    `# ${peterLifeline.name}`,
    "",
    peterLifeline.description,
    "",
    "Director of Software Engineering at GLG. Born 1984 in Raleigh, North Carolina.",
    "",
    "- Website: https://www.peterlewis.dev",
    "- GitHub: https://github.com/peter-lewis",
    "- LinkedIn: https://www.linkedin.com/in/peternlewis",
    "",
    "## Timeline",
    "",
  ]

  for (const marker of peterLifeline.markers) {
    const age = marker.age ?? marker.year - peterLifeline.birthYear
    const entries = marker.events.map(eventText)

    if (marker.mentors?.length) {
      entries.push(
        `People: ${marker.mentors
          .map((person) =>
            person.role ? `${person.name} (${person.role})` : person.name,
          )
          .join(", ")}`,
      )
    }

    if (marker.met?.length) {
      entries.push(`Met: ${marker.met.map((person) => person.name).join(", ")}`)
    }

    // `defineLifeline` pads the quiet years so the rail has a continuous
    // axis. They carry nothing to read, so they don't belong in prose.
    if (entries.length === 0) continue

    lines.push(`### ${marker.year} (age ${age})`, "")
    for (const entry of entries) lines.push(`- ${entry}`)
    lines.push("")
  }

  setResponseHeader(event, "content-type", "text/plain; charset=utf-8")

  return lines.join("\n")
})
