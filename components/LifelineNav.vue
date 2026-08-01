<script setup lang="ts">
import { cn } from "@/components/lifeline/cn"

const CONTAINER = "mx-auto flex w-full max-w-5xl items-center px-6"

const props = withDefaults(
  defineProps<{
    logoHref?: string
    /** Accessible name for the logo link. */
    logoLabel?: string
    class?: string
    containerClass?: string
  }>(),
  { logoHref: "/", logoLabel: "Home" },
)
</script>

<template>
  <nav
    :class="
      cn(
        'fixed inset-x-0 top-0 z-50 border-b border-black/10 bg-white/80 backdrop-blur-xl transition-colors duration-300 dark:border-white/10 dark:bg-black/80',
        props.class,
      )
    "
  >
    <div
      data-site-nav-inner
      :class="cn(CONTAINER, 'h-16 justify-between', props.containerClass)"
    >
      <!-- The rail measures its start from this anchor's left edge. -->
      <a
        :href="props.logoHref"
        data-site-nav-logo
        :aria-label="props.logoLabel"
        class="text-black transition-[color,opacity] duration-300 hover:opacity-70 dark:text-white"
      >
        <slot name="logo" />
      </a>

      <div v-if="$slots.default" class="flex items-center gap-8">
        <slot />
      </div>
    </div>
  </nav>
</template>
