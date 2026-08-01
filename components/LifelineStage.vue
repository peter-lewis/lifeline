<script setup lang="ts">
import { cn } from "@/components/lifeline/cn"

/**
 * The stage. `pt-16` clears the fixed nav; `md:overflow-hidden` hands
 * scrolling to the horizontal scrub above the mobile breakpoint.
 */
const props = defineProps<{ class?: string }>()
</script>

<template>
  <main
    :class="
      cn('flex-1 min-h-0 overflow-y-auto pt-16 md:overflow-hidden', props.class)
    "
  >
    <slot />
  </main>
</template>
