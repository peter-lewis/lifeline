<script setup lang="ts">
import { provide, reactive } from "vue"
import { LIFELINE_TRACKS, type LifelineTracksApi } from "./lifeline-tracks"
import type { LifelineFilterKey } from "./types"

/**
 * Renderless. Holds which tracks are on and hands the timeline and the
 * legend a shared view of it — it has to sit above both, which in practice
 * means wrapping the whole page rather than just the stage.
 *
 * All three can be switched off at once. That leaves the year and age rail
 * standing with a column of ghost dots, which reads clearly enough as a
 * state you got yourself into and can leave with one tap.
 */
const props = withDefaults(
  defineProps<{ tracks?: LifelineFilterKey[] }>(),
  { tracks: () => ["tech", "work", "life", "influence"] },
)

// A reactive Set rather than a ref of an array: `isEnabled` is called once
// per event per render, and membership beats a linear scan.
const enabled = reactive(new Set<LifelineFilterKey>(props.tracks))

const api: LifelineTracksApi = {
  isEnabled: (key) => enabled.has(key),
  toggle: (key) => {
    if (enabled.has(key)) enabled.delete(key)
    else enabled.add(key)
  },
}

provide(LIFELINE_TRACKS, api)
</script>

<template>
  <slot />
</template>
