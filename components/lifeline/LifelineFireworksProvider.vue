<script setup lang="ts">
import { computed, onBeforeUnmount, provide, ref } from "vue"
import LifelineFireworksCanvas from "./LifelineFireworksCanvas.vue"
import {
  LIFELINE_FIREWORKS,
  PALETTES,
  type LifelineFireworksApi,
} from "./lifeline-fireworks"
import { useLifelineTheme } from "./lifeline-theme"
import type { LifelineEventEffect } from "./types"

/** Wait for the theme cross-fade before the first burst. */
const NIGHTFALL_MS = 400

// Optional. With no theme bridge provided the show still runs; it just
// doesn't dim the page first.
const theme = useLifelineTheme()
const playing = ref(false)
// Not `effect` — Nuxt auto-imports Vue's `effect`, which would shadow it
// inside the template.
const activeEffect = ref<LifelineEventEffect>("fireworks")
let restoreTheme: "light" | "dark" | null = null
let nightfall = 0

const api: LifelineFireworksApi = {
  launch(nextEffect) {
    if (playing.value) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    activeEffect.value = nextEffect

    // Fireworks belong in the dark: switch a light page to dark for
    // the show, and restore afterwards.
    if (theme && theme.resolved() === "light") {
      restoreTheme = "light"
      theme.set("dark")
      window.clearTimeout(nightfall)
      nightfall = window.setTimeout(() => {
        playing.value = true
      }, NIGHTFALL_MS)
      return
    }

    restoreTheme = null
    playing.value = true
  },
}

provide(LIFELINE_FIREWORKS, api)

const palette = computed(() => PALETTES[activeEffect.value])

function done() {
  playing.value = false
  if (restoreTheme && theme) {
    theme.set(restoreTheme)
    restoreTheme = null
  }
}

onBeforeUnmount(() => window.clearTimeout(nightfall))
</script>

<template>
  <slot />
  <LifelineFireworksCanvas v-if="playing" :palette="palette" @done="done" />
</template>
