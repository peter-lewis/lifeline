<script setup lang="ts">
import { cn } from "@/components/lifeline/cn"

/**
 * The page framing the Lifeline expects.
 *
 * The rail is not sized by CSS — on desktop it measures where to start
 * and end from the nav: `data-site-nav-logo` gives it the start, and the
 * right edge of `data-site-nav-inner` gives it the end. That is what
 * keeps the timeline inset from the viewport and aligned with the rest
 * of the page, and it's the span the intro animation draws across.
 *
 * Drop the nav entirely and the rail falls back to filling its own
 * container, edge to edge.
 */
const props = defineProps<{ class?: string }>()
</script>

<template>
  <div
    :class="
      cn(
        'flex h-dvh flex-col overflow-hidden bg-white text-black antialiased transition-colors duration-300 dark:bg-black dark:text-white',
        props.class,
      )
    "
  >
    <slot />
  </div>
</template>
