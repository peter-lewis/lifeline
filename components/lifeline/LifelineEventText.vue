<script setup lang="ts">
import { computed } from "vue"
import { getEventContent } from "./lifeline-event-utils"
import type { LifelineEvent, LifelineEventSegment } from "./types"

const props = defineProps<{ event: LifelineEvent; class?: string }>()

const content = computed(() => getEventContent(props.event))

/** Split into two narrowed computeds — the template can't narrow a union. */
const plain = computed(() =>
  typeof content.value === "string" ? content.value : null,
)
const segments = computed<LifelineEventSegment[]>(() =>
  typeof content.value === "string" ? [] : content.value,
)
</script>

<template>
  <span v-if="plain !== null" :class="props.class">{{ plain }}</span>
  <span v-else :class="props.class">
    <template v-for="(segment, index) in segments" :key="index">
      <a
        v-if="segment.type === 'link'"
        :href="segment.href"
        target="_blank"
        rel="noopener noreferrer"
        class="underline decoration-zinc-400 underline-offset-2 transition-colors duration-300 group-hover:text-black group-hover:decoration-zinc-600 dark:decoration-zinc-700 dark:group-hover:text-white dark:group-hover:decoration-zinc-400"
        >{{ segment.value }}</a
      >
      <span v-else>{{ segment.value }}</span>
    </template>
  </span>
</template>
