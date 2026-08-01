<script setup lang="ts">
/**
 * "PL" monogram. Drawn as paths rather than SVG <text> so it renders
 * identically regardless of whether Geist has loaded yet — the nav is
 * above the fold and a text-based mark would reflow on font swap.
 *
 * Inherits `currentColor`, so the nav's light/dark colour transition
 * carries it for free.
 */
const props = defineProps<{ class?: string }>()
</script>

<template>
  <svg
    viewBox="0 0 40 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    :class="props.class"
    aria-hidden="true"
  >
    <!-- P: stem plus a closed bowl on the upper half. -->
    <path
      d="M2 3h7.4c2.15 0 3.86.62 5.1 1.87 1.25 1.24 1.88 2.9 1.88 4.96 0 2.07-.63 3.73-1.88 4.98-1.24 1.24-2.95 1.86-5.1 1.86H5.5V21H2V3Zm3.5 3.05v6.57h3.5c1.16 0 2.06-.29 2.68-.87.63-.59.95-1.4.95-2.42 0-1.02-.32-1.82-.95-2.4-.62-.59-1.52-.88-2.68-.88H5.5Z"
    />
    <!-- L: stem plus foot. -->
    <path d="M22.6 3h3.5v14.9H35V21H22.6V3Z" />
  </svg>
</template>
