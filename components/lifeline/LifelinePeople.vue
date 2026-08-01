<script setup lang="ts">
import { LIFELINE_INFLUENCE_DOT } from "./lifeline-event-utils"
import {
  getInitials,
  type AggregatedLifelinePerson,
} from "./lifeline-people-utils"

const props = withDefaults(
  defineProps<{ people: AggregatedLifelinePerson[]; allowWrap?: boolean }>(),
  { allowWrap: false },
)
</script>

<template>
  <div v-if="props.people.length > 0" class="w-full space-y-3">
    <div
      v-for="person in props.people"
      :key="person.name"
      class="flex w-full items-center gap-2.5"
    >
      <div class="flex w-3 shrink-0 items-center justify-center gap-0.5">
        <span
          v-if="person.mentor"
          :class="`h-1.5 w-1.5 rounded-full ${LIFELINE_INFLUENCE_DOT}`"
          aria-hidden="true"
        />
        <span
          v-if="person.met"
          class="h-1.5 w-1.5 rounded-full bg-pink-500"
          aria-hidden="true"
        />
      </div>
      <img
        v-if="person.photo"
        :src="person.photo"
        :alt="person.name"
        width="28"
        height="28"
        loading="lazy"
        class="h-7 w-7 shrink-0 rounded-full object-cover"
      />
      <span
        v-else
        class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-black text-[10px] font-medium text-white transition-colors duration-300 dark:bg-white dark:text-black"
      >
        {{ getInitials(person.name) }}
      </span>
      <p
        :class="
          props.allowWrap
            ? 'text-left text-[13px] leading-snug text-zinc-500 transition-colors duration-300'
            : 'whitespace-nowrap text-left text-[13px] text-zinc-500 transition-colors duration-300 group-hover:text-zinc-700 dark:group-hover:text-zinc-400'
        "
      >
        {{ person.name }}
      </p>
    </div>
  </div>
</template>
