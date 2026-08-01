<script setup lang="ts">
import { computed, type CSSProperties } from "vue"
import { cn } from "./cn"
import CompanyIcon from "./CompanyIcon.vue"
import LifelinePeople from "./LifelinePeople.vue"
import LifelineCollapse from "./LifelineCollapse.vue"
import LifelinePhotoCard from "./LifelinePhotoCard.vue"
import LifelineVerticalEvent from "./LifelineVerticalEvent.vue"
import { getLifelineEventKey } from "./lifeline-event-utils"
import { aggregateLifelinePeople } from "./lifeline-people-utils"
import {
  arePeopleMuted,
  getMarkerTracks,
  getMutedMarkerTracks,
  isLifelineTrackMuted,
  useLifelineTracks,
} from "./lifeline-tracks"
import {
  hasMarkerContent,
  visibleMarkerCompanies,
  visibleMarkerPhotos,
} from "./lifeline-utils"
import {
  getLifelineEventTrack,
  LIFELINE_LEGEND_DOT,
} from "./lifeline-event-utils"
import type {
  LifelineEvent,
  LifelineFilterKey,
  LifelineMarker,
} from "./types"

const GRID_CLASS = "grid grid-cols-[2.5rem_1rem_1fr] gap-x-3"

const props = withDefaults(
  defineProps<{
    marker: LifelineMarker
    birthYear: number
    animateIntro?: boolean
    introDelay?: number
    introDuration?: number
    revealPending?: boolean
  }>(),
  {
    animateIntro: false,
    introDelay: 0,
    introDuration: 420,
    revealPending: false,
  },
)

const tracks = useLifelineTracks()

const isMuted = (event: LifelineEvent) =>
  isLifelineTrackMuted(tracks, getLifelineEventTrack(event))

/** One dot per thread this year is hiding, shown beside the year itself. */
const mutedTracks = computed(() =>
  getMutedMarkerTracks(
    props.marker.events,
    tracks,
    aggregateLifelinePeople(props.marker).length > 0,
  ),
)

/** Every thread this year carries, so the dots can fold instead of pop. */
const allTracks = computed(() =>
  getMarkerTracks(
    props.marker.events,
    aggregateLifelinePeople(props.marker).length > 0,
  ),
)

const isTrackOn = (key: LifelineFilterKey) =>
  tracks === null || tracks.isEnabled(key)

/** Badges and photographs follow their own track when they carry one. */
const companies = computed(() =>
  visibleMarkerCompanies(props.marker, (event) => !isMuted(event), isTrackOn),
)

const age = computed(() => props.marker.age ?? props.marker.year - props.birthYear)
// The faces are their own thread — one switch, not per person.
const people = computed(() =>
  arePeopleMuted(tracks) ? [] : aggregateLifelinePeople(props.marker),
)
const photos = computed(() =>
  visibleMarkerPhotos(props.marker, (event) => !isMuted(event), isTrackOn),
)
const hasContent = computed(
  () =>
    hasMarkerContent(
      props.marker,
      (event) => !isMuted(event),
      isTrackOn,
      !arePeopleMuted(tracks),
    ) || photos.value.length > 0,
)

/**
 * What this year could show with every thread on. The content block is
 * mounted on this and folded on `hasContent`: `v-if`-ing it on the live
 * value would cut the fold off halfway and the year would simply blink out.
 */
const hasContentEver = computed(
  () => hasMarkerContent(props.marker) || (props.marker.photos?.length ?? 0) > 0,
)
const allPeople = computed(() => aggregateLifelinePeople(props.marker))

// Fresh tilts per visit; stacked neighbors lean apart.
const photoTilts = (props.marker.photos ?? []).map((_, index) => {
  const sign =
    (props.marker.photos?.length ?? 0) > 1
      ? index % 2 === 0
        ? -1
        : 1
      : Math.random() > 0.5
        ? 1
        : -1
  return sign * (2 + Math.random() * 4)
})

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
  <li
    :class="
      cn(
        'transition-[padding] duration-300 ease-out',
        hasContent ? 'pb-10' : 'pb-3',
      )
    "
    :aria-label="props.marker.label ?? `${props.marker.year}`"
  >
    <div
      :class="
        cn(
          props.animateIntro && 'lifeline-marker-intro',
          props.revealPending && 'opacity-0',
        )
      "
      :style="introStyle"
    >
      <div :class="`${GRID_CLASS} items-center`">
        <p
          class="text-right text-[11px] font-medium leading-4 tabular-nums text-zinc-500 transition-colors duration-300 dark:text-zinc-600"
        >
          {{ age }}
        </p>

        <div class="flex items-center justify-center">
          <span
            aria-hidden="true"
            class="block h-px w-[10px] bg-zinc-400 transition-colors duration-300 dark:bg-zinc-700"
          />
        </div>

        <div class="flex items-center">
          <p
            class="whitespace-nowrap text-[15px] font-medium leading-5 tabular-nums text-zinc-500 transition-colors duration-300 dark:text-zinc-400"
          >
            {{ props.marker.label ?? props.marker.year }}
          </p>

          <!--
            What this year is hiding: one dot per thread, not per event.
            Mounted for every thread the year carries and folded sideways
            on the hidden ones, so they slide in rather than appear.
          -->
          <LifelineCollapse
            v-for="key in allTracks"
            :key="key"
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
      </div>

      <div v-if="hasContentEver" :class="GRID_CLASS">
        <div aria-hidden="true" />
        <div aria-hidden="true" />
        <!--
          Mounted on what the year could ever show and folded on what it is
          showing. `v-if` on the live value would cut the fold off and the
          whole year would blink out instead of closing.
        -->
        <LifelineCollapse :show="hasContent" class="min-w-0">
          <div
            class="mt-6 min-w-0 text-zinc-500 transition-colors duration-300 dark:text-zinc-400"
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
                class="h-6 w-6 object-contain opacity-80"
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
                  class="opacity-70"
                />
              </div>
            </LifelineCollapse>

            <div v-if="props.marker.events.length > 0" class="-mb-4">
              <LifelineVerticalEvent
                v-for="(event, index) in props.marker.events"
                :key="getLifelineEventKey(event, index)"
                :event="event"
              />
            </div>

            <LifelineCollapse
              v-if="props.marker.photos?.length"
              :show="photos.length > 0"
            >
              <div class="mt-6 flex flex-wrap items-start">
                <LifelinePhotoCard
                  v-for="(photo, index) in props.marker.photos"
                  :key="`${photo.src}-${index}`"
                  :photo="photo"
                  :rotate="photo.rotate ?? photoTilts[index] ?? 0"
                  :width="160"
                  :class="cn('relative', index > 0 && '-ml-8 mt-6')"
                />
              </div>
            </LifelineCollapse>

            <LifelineCollapse
              v-if="allPeople.length > 0"
              :show="people.length > 0"
            >
              <div
                class="mt-6 border-t border-zinc-200/70 pt-5 transition-colors duration-300 dark:border-zinc-800/70"
              >
                <LifelinePeople :people="allPeople" allow-wrap />
              </div>
            </LifelineCollapse>
          </div>
        </LifelineCollapse>
      </div>
    </div>
  </li>
</template>
