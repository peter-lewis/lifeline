<script setup lang="ts">
import { provide } from "vue"
import { LIFELINE_THEME } from "@/components/lifeline/lifeline-theme"

/**
 * The Nuxt adapter — and the only file in this project that knows Nuxt
 * exists. Wrap anything that should be able to read or change the theme:
 *
 *   <LifelineNuxtTheme>
 *     <Lifeline ... />
 *   </LifelineNuxtTheme>
 *
 * A plain Vue app writes its own eight-line equivalent against whatever
 * it already uses (VueUse's useDark, a Pinia store, a class on <html>)
 * and provides LIFELINE_THEME the same way. The timeline itself has no
 * opinion beyond the two methods.
 */
const colorMode = useColorMode()

provide(LIFELINE_THEME, {
  resolved: () => (colorMode.value === "dark" ? "dark" : "light"),
  set: (theme) => {
    colorMode.preference = theme
  },
})
</script>

<template>
  <slot />
</template>
