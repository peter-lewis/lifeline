<script setup lang="ts">
import { cn } from "@/components/lifeline/cn"
import { LIFELINE_LEGEND_DOT } from "@/components/lifeline/lifeline-event-utils"
import { useLifelineTracks } from "@/components/lifeline/lifeline-tracks"
import type {
  LifelineFilterKey,
  LifelineLegendItem,
} from "@/components/lifeline/types"

// Inlined rather than referencing a module const — `withDefaults` is
// hoisted out of setup(), so it cannot close over a local binding.
const props = withDefaults(defineProps<{ items?: LifelineLegendItem[] }>(), {
  items: (): LifelineLegendItem[] => [
    { type: "tech", label: "Tech" },
    { type: "work", label: "Work" },
    { type: "life", label: "Life" },
    // The faces are a thread of their own: an influence is rarely
    // confined to one of the three above.
    { type: "influence", label: "People" },
  ],
})

/**
 * Null when no `LifelineTracksProvider` sits above this — the legend then
 * renders as the plain key it has always been, with nothing to press.
 */
const tracks = useLifelineTracks()

const isOn = (type: string) =>
  tracks === null || tracks.isEnabled(type as LifelineFilterKey)
</script>

<template>
  <ul
    class="flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-zinc-500"
  >
    <li v-for="item in props.items" :key="item.type">
      <!--
        A key when it is only a key, a switch when something is listening.
        `span` takes no focus and announces nothing, which is right for the
        static case and wrong for the interactive one.
      -->
      <component
        :is="tracks ? 'button' : 'span'"
        :type="tracks ? 'button' : undefined"
        :aria-pressed="tracks ? isOn(item.type) : undefined"
        :class="
          cn(
            'flex items-center gap-2 transition-colors duration-300',
            tracks &&
              'cursor-pointer rounded-sm hover:text-black focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-zinc-400 dark:hover:text-white',
            tracks && !isOn(item.type) && 'text-zinc-400 dark:text-zinc-600',
          )
        "
        @click="tracks?.toggle(item.type as LifelineFilterKey)"
      >
        <span
          :class="
            cn(
              'h-1.5 w-1.5 shrink-0 rounded-full transition-opacity duration-300 ease-out',
              LIFELINE_LEGEND_DOT[item.type],
              !isOn(item.type) && 'opacity-30',
            )
          "
          aria-hidden="true"
        />
        <span>{{ item.label }}</span>
      </component>
    </li>
  </ul>
</template>
