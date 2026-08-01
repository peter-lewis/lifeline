import type { LifelineMarker } from "./types"

export interface AggregatedLifelinePerson {
  name: string
  mentor: boolean
  met: boolean
  photo?: string
}

/**
 * One row per person, even when they appear in both slots — Guillermo
 * Rauch is a mentor *and* met in person in 2014, and that reads as one
 * face with two dots rather than two rows of the same face.
 */
export function aggregateLifelinePeople(
  marker: LifelineMarker,
): AggregatedLifelinePerson[] {
  const map = new Map<string, AggregatedLifelinePerson>()

  const add = (name: string, type: "mentor" | "met", photo?: string) => {
    const person = map.get(name) ?? { name, mentor: false, met: false }
    person[type] = true
    person.photo = person.photo ?? photo
    map.set(name, person)
  }

  marker.mentors?.forEach((person) => add(person.name, "mentor", person.photo))
  marker.met?.forEach((person) => add(person.name, "met", person.photo))

  return [...map.values()]
}

export function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
}
