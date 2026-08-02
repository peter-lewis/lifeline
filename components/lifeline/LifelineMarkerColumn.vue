<script setup lang="ts">
import { computed, type CSSProperties } from "vue"
import { Film, ImageIcon } from "@lucide/vue"
import { cn } from "./cn"
import CompanyIcon from "./CompanyIcon.vue"
import LifelineCollapse from "./LifelineCollapse.vue"
import LifelineEventText from "./LifelineEventText.vue"
import LifelinePeople from "./LifelinePeople.vue"
import {
  getLifelineEventEffect,
  getLifelineEventImage,
  getLifelineEventKey,
  getLifelineEventTrack,
  LIFELINE_LEGEND_DOT,
  LIFELINE_TRACK_DOT,
} from "./lifeline-event-utils"
import { useLifelineFireworks } from "./lifeline-fireworks"
import { useLifelineHoverImage } from "./lifeline-hover-image"
import { aggregateLifelinePeople } from "./lifeline-people-utils"
import {
  arePeopleMuted,
  getMarkerTracks,
  getMutedMarkerTracks,
  isLifelineTrackMuted,
  useLifelineTracks,
} from "./lifeline-tracks"
import { visibleMarkerCompanies } from "./lifeline-utils"
import type {
  LifelineEvent,
  LifelineFilterKey,
  LifelineMarker,
} from "./types"

const props = withDefaults(
  defineProps<{
    marker: LifelineMarker
    birthYear: number
    minWidth: number
    animateIntro?: boolean
    introDelay?: number
    introDuration?: number
  }>(),
  { animateIntro: false, introDelay: 0, introDuration: 420 },
)

const hoverImage = useLifelineHoverImage()
const fireworks = useLifelineFireworks()
const tracks = useLifelineTracks()

const isMuted = (event: LifelineEvent) =>
  isLifelineTrackMuted(tracks, getLifelineEventTrack(event))

const isTrackOn = (key: LifelineFilterKey) =>
  tracks === null || tracks.isEnabled(key)

// Kept in step with `getMarkerWidth`, which uses the same tests. If badges
// or faces outlived the width they would overflow a collapsed 80px column.
const companies = computed(() =>
  visibleMarkerCompanies(props.marker, (event) => !isMuted(event), isTrackOn),
)

/** Every thread this year carries, so the dots can fold instead of pop. */
const allTracks = computed(() =>
  getMarkerTracks(
    props.marker.events,
    aggregateLifelinePeople(props.marker).length > 0,
  ),
)

/** One dot per thread this year is hiding, shown beside the year itself. */
const mutedTracks = computed(() =>
  getMutedMarkerTracks(
    props.marker.events,
    tracks,
    aggregateLifelinePeople(props.marker).length > 0,
  ),
)

const age = computed(() => props.marker.age ?? props.marker.year - props.birthYear)
// The faces are their own thread — one switch, not per person.
const allPeople = computed(() => aggregateLifelinePeople(props.marker))
// The faces are their own thread — one switch, not per person.
const people = computed(() => (arePeopleMuted(tracks) ? [] : allPeople.value))

const introStyle = computed<CSSProperties>(() =>
  props.animateIntro
    ? ({
        animationDelay: `${props.introDelay}ms`,
        "--lifeline-marker-fade-ms": `${props.introDuration}ms`,
      } as CSSProperties)
    : {},
)
</script>

<template>
  <div
    class="group relative shrink-0 pr-8 transition-[opacity,width] duration-[300ms,420ms] ease-out will-change-opacity"
    :style="{ width: `${props.minWidth}px` }"
    :aria-label="props.marker.label ?? `${props.marker.year}`"
  >
    <div
      :class="cn('relative', props.animateIntro && 'lifeline-marker-intro')"
      :style="introStyle"
    >
      <span
        class="absolute left-0 top-[var(--lifeline-rail)] z-10 h-[10px] w-px -translate-y-1/2 bg-zinc-400 transition-colors duration-300 group-hover:bg-zinc-600 dark:bg-zinc-700 dark:group-hover:bg-zinc-400"
        aria-hidden="true"
      />

      <div class="flex w-full flex-col items-start text-left">
        <p
          class="mb-5 h-4 text-[11px] font-medium leading-4 tabular-nums text-zinc-500 transition-colors duration-300 group-hover:text-black dark:text-zinc-400"
        >
          {{ age }}
        </p>

        <div class="mb-6 flex h-5 items-center">
          <p
            class="whitespace-nowrap text-[15px] font-medium leading-5 tabular-nums text-zinc-500 transition-colors duration-300 group-hover:text-black dark:text-zinc-400 dark:group-hover:text-white"
          >
            {{ props.marker.label ?? props.marker.year }}
          </p>

          <!--
            What this year is hiding: one dot per thread, not per event.
            Mounted for every thread the year carries and folded sideways
            on the hidden ones, so they slide in rather than appear.
          -->
          <!--
            `shrink-0` because these are flex items: without it they are
            free to shrink below their content, and the fold's
            `overflow-hidden` then clips the dot rather than the row
            overflowing visibly. `getMarkerWidth` buys the room, this
            stops it being given back.
          -->
          <LifelineCollapse
            v-for="key in allTracks"
            :key="key"
            class="shrink-0"
            axis="x"
            :show="mutedTracks.includes(key)"
          >
            <span
              :class="
                cn(
                  'ml-2 block h-1.5 w-1.5 shrink-0 rounded-full opacity-40',
                  LIFELINE_LEGEND_DOT[key],
                )
              "
              aria-hidden="true"
            />
          </LifelineCollapse>
        </div>

        <div
          class="relative w-full pb-10 text-zinc-500 transition-colors duration-300 group-hover:text-black dark:text-zinc-400 dark:group-hover:text-zinc-300"
        >
          <!-- People belong directly beneath their year's events. Keep a
               small gap, but do not reserve a shared vertical band: doing
               so stranded people far below years with short event lists. -->
          <div
            :class="
              cn(
                'flex w-full flex-col items-start pt-6',
                people.length > 0 && 'pb-6',
              )
            "
          >
            <div
              v-if="props.marker.badges?.length"
              class="mb-3 flex items-center justify-start gap-2"
            >
              <img
                v-for="badge in props.marker.badges"
                :key="badge.src"
                :src="badge.src"
                :alt="badge.alt"
                class="h-6 w-6 object-contain opacity-80 transition-opacity duration-300 group-hover:opacity-100"
              />
            </div>

            <LifelineCollapse
              v-if="props.marker.companies?.length"
              :show="companies.length > 0"
            >
              <div class="mb-2 flex items-center justify-start gap-1.5">
                <CompanyIcon
                  v-for="company in props.marker.companies"
                  :key="company.id"
                  :id="company.id"
                  :label="company.name"
                  class="opacity-70 transition-opacity duration-300 group-hover:opacity-100"
                />
              </div>
            </LifelineCollapse>

            <!--
              The gap between events lives inside the fold, so a muted one
              contributes nothing at all: no dot, no line, and no space
              where a line used to be. What it was is recorded once, as a
              dot beside the year. `-mb-4` absorbs the last item's margin.
            -->
            <div class="-mb-4 min-h-[3.25rem]">
              <div
                v-for="(event, index) in props.marker.events"
                :key="getLifelineEventKey(event, index)"
                class="grid transition-[grid-template-rows,opacity] duration-300 ease-out"
                :style="{
                  gridTemplateRows: isMuted(event) ? '0fr' : '1fr',
                  opacity: isMuted(event) ? 0 : 1,
                }"
                :aria-hidden="isMuted(event) ? 'true' : undefined"
              >
                <div class="min-h-0 overflow-hidden">
                  <p
                    :class="
                      cn(
                        'mb-4 max-w-[18rem] text-left text-[14px] leading-[1.55] tracking-[-0.01em]',
                        // Hanging dot: the text block stays flush with the
                        // column while the marker sits in the gutter.
                        getLifelineEventTrack(event) && 'relative pl-4',
                        // Muted text is invisible but still in layout, so a
                        // column narrowing to 80px would re-wrap every
                        // hidden paragraph on the way. Pinning the width
                        // holds the line breaks still — nothing can see
                        // them — and takes the text out of the resize.
                        isMuted(event) && 'w-[18rem]',
                        getLifelineEventEffect(event) &&
                          !isMuted(event) &&
                          'cursor-pointer',
                      )
                    "
                    :data-lifeline-interactive="
                      getLifelineEventEffect(event) && !isMuted(event)
                        ? ''
                        : undefined
                    "
                    @mouseenter="
                      !isMuted(event) &&
                        getLifelineEventImage(event) &&
                        hoverImage?.show(getLifelineEventImage(event)!)
                    "
                    @mouseleave="
                      getLifelineEventImage(event) && hoverImage?.hide()
                    "
                    @click="
                      !isMuted(event) &&
                        getLifelineEventEffect(event) &&
                        fireworks?.launch(getLifelineEventEffect(event)!)
                    "
                  >
                    <span
                      v-if="getLifelineEventTrack(event)"
                      :class="
                        cn(
                          'absolute left-0 top-[0.5em] h-1.5 w-1.5 rounded-full',
                          LIFELINE_TRACK_DOT[getLifelineEventTrack(event)!],
                        )
                      "
                      aria-hidden="true"
                    />
                    <LifelineEventText :event="event" />
                    <!-- Glued to the last word with a no-break space so the
                         icon can never wrap onto a line of its own. -->
                    <span
                      v-if="getLifelineEventImage(event)"
                      class="whitespace-nowrap"
                    >
                      {{ " " }}
                      <Film
                        v-if="getLifelineEventImage(event)!.video"
                        class="ml-0.5 inline-block h-3 w-3 -translate-y-px text-zinc-400 transition-colors duration-300 dark:text-zinc-600"
                        :stroke-width="1.75"
                        aria-hidden="true"
                      />
                      <ImageIcon
                        v-else
                        class="ml-0.5 inline-block h-3 w-3 -translate-y-px text-zinc-400 transition-colors duration-300 dark:text-zinc-600"
                        :stroke-width="1.75"
                        aria-hidden="true"
                      />
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          <LifelineCollapse
            v-if="allPeople.length > 0"
            :show="people.length > 0"
            class="w-full"
          >
            <LifelinePeople :people="allPeople" />
          </LifelineCollapse>
        </div>
      </div>
    </div>
  </div>
</template>
