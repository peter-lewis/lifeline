<script setup lang="ts">
import { computed } from "vue"
import { cn } from "./cn"
import { getCompanyIcon } from "./company-registry"

const props = defineProps<{ id: string; label: string; class?: string }>()

const entry = computed(() => getCompanyIcon(props.id))
</script>

<template>
  <span
    v-if="entry"
    :class="
      cn(
        'inline-flex shrink-0 items-center justify-center text-black transition-colors duration-300 dark:text-white',
        entry.sizeClass ?? 'h-4 w-4',
        props.class,
      )
    "
    :aria-label="props.label"
    :title="props.label"
  >
    <component :is="entry.icon" class="h-full w-full" />
  </span>

  <!-- Unregistered ids fall back to the name's initial in a small ring,
       so a timeline reads cleanly before you've drawn a single logo. -->
  <span
    v-else
    :title="props.label"
    :aria-label="props.label"
    :class="
      cn(
        'inline-flex h-5 w-5 select-none items-center justify-center rounded-full text-[10px] font-semibold uppercase leading-none ring-1 ring-current/30',
        props.class,
      )
    "
  >
    {{ props.label.charAt(0) }}
  </span>
</template>
