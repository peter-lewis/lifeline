<script setup lang="ts">
import { LIFELINE_LABEL_COLUMN_WIDTH } from "./lifeline-labels-shared"
</script>

<template>
  <div
    class="relative"
    :style="{ width: `${LIFELINE_LABEL_COLUMN_WIDTH}px` }"
    aria-hidden="true"
  >
    <div class="flex flex-col items-start text-left">
      <p
        class="mb-5 h-4 text-[11px] font-medium uppercase leading-4 tracking-[0.08em] text-zinc-500 transition-colors duration-300 dark:text-zinc-600"
      >
        Age
      </p>
      <p
        class="mb-6 h-5 text-[11px] font-medium uppercase leading-5 tracking-[0.08em] text-zinc-500 transition-colors duration-300 dark:text-zinc-600"
      >
        Years
      </p>
    </div>
  </div>
</template>
