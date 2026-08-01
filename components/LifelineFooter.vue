<script setup lang="ts">
import { cn } from "@/components/lifeline/cn"

const CONTAINER = "mx-auto flex w-full max-w-5xl items-center px-6"

const props = defineProps<{ class?: string; containerClass?: string }>()
</script>

<template>
  <footer
    :class="
      cn(
        'shrink-0 border-t border-black/10 bg-white/95 backdrop-blur-sm transition-colors duration-300 dark:border-white/10 dark:bg-black/95',
        props.class,
      )
    "
  >
    <div
      :class="cn(CONTAINER, 'h-16 justify-between gap-6', props.containerClass)"
    >
      <slot />
    </div>
  </footer>
</template>
