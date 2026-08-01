<script setup lang="ts">
import { computed, onMounted, ref } from "vue"
import { Moon, Sun } from "@lucide/vue"
import { useLifelineTheme } from "@/components/lifeline/lifeline-theme"

/**
 * Drives whatever theme bridge the host provided (see lifeline-theme.ts).
 * Renders nothing if none is wired up, rather than guessing at a global.
 */
const theme = useLifelineTheme()
const mounted = ref(false)

onMounted(() => {
  mounted.value = true
})

const isDark = computed(() => theme?.resolved() === "dark")

function toggle() {
  theme?.set(isDark.value ? "light" : "dark")
}
</script>

<template>
  <!-- Reserve the box until the resolved theme is known, so the footer
       row doesn't reflow on hydration. -->
  <span v-if="!mounted || !theme" class="inline-block h-4 w-4" aria-hidden="true" />
  <button
    v-else
    type="button"
    :aria-label="isDark ? 'Switch to light theme' : 'Switch to dark theme'"
    class="inline-flex items-center p-0 text-zinc-500 transition-colors duration-300 hover:text-black dark:hover:text-white"
    @click="toggle"
  >
    <Sun v-if="isDark" class="h-4 w-4" :stroke-width="1.75" />
    <Moon v-else class="h-4 w-4" :stroke-width="1.75" />
  </button>
</template>
