<script setup lang="ts">
import { computed } from "vue"
import { getEventContent, getLifelineEventImage } from "./lifeline-event-utils"
import type { LifelineMarker } from "./types"

/**
 * The server-rendered form of the timeline.
 *
 * Both interactive layouts measure the viewport before they can draw, and
 * both hold themselves at `visibility: hidden` until that measurement
 * lands (`isLayoutReady`). That is right for the animation and fatal for
 * indexing: server-render either tree and the whole biography ships inside
 * a hidden box, which crawlers discount. So the server renders this
 * instead — the same `markers` array, as an ordinary document.
 *
 * It is not a summary and not a second copy of the content: it reads the
 * one array in `lib/peter.ts` that the real timeline reads, so the two
 * cannot drift. `Lifeline.vue` swaps it out for the measured layout the
 * moment the breakpoint is known.
 *
 * Browsers never see it. An inline script in `nuxt.config.ts` puts `js` on
 * <html> before the body paints, and `.js .lifeline-static` is
 * `display: none` — so this renders for anything that doesn't run
 * scripts, and the reader goes straight to the timeline with no flash of
 * a document underneath it.
 */
const props = defineProps<{
  markers: LifelineMarker[]
  birthYear: number
  title: string
  description?: string
}>()

/**
 * `defineLifeline` pads every year between birth and end so the rail has a
 * continuous axis, which leaves a lot of markers holding nothing. An empty
 * <li> is worth something on a rail and nothing in a document, so the
 * quiet years drop out here.
 */
const filled = computed(() =>
  props.markers.filter(
    (marker) =>
      marker.events.length > 0 ||
      (marker.mentors?.length ?? 0) > 0 ||
      (marker.met?.length ?? 0) > 0 ||
      (marker.photos?.length ?? 0) > 0,
  ),
)

const ageAt = (marker: LifelineMarker) =>
  marker.age ?? marker.year - props.birthYear
</script>

<template>
  <div class="lifeline-static mx-auto w-full max-w-[46rem] px-6 pb-20 pt-6">
    <h1 class="text-[22px] font-medium tracking-[-0.01em]">{{ props.title }}</h1>

    <p
      v-if="props.description"
      class="mt-3 text-[14px] leading-[1.6] text-zinc-500"
    >
      {{ props.description }}
    </p>

    <ol class="mt-10 space-y-8">
      <li v-for="marker in filled" :key="marker.id">
        <h2 class="text-[15px] font-medium tabular-nums">
          {{ marker.label ?? marker.year }}
          <span class="ml-2 font-normal text-zinc-500">
            age {{ ageAt(marker) }}
          </span>
        </h2>

        <p
          v-if="marker.companies?.length"
          class="mt-1 text-[13px] text-zinc-500"
        >
          {{ marker.companies.map((company) => company.name).join(" · ") }}
        </p>

        <div class="mt-2 space-y-2">
          <div v-for="(event, index) in marker.events" :key="index">
            <p class="text-[14px] leading-[1.6]">
              <!--
                Events are `string | LifelineEventSegment[] | {text}`.
                getEventContent unwraps the object form; what's left is a
                bare string or the segment array, and segments are what
                carry the outbound links worth crawling.
              -->
              <template
                v-if="typeof getEventContent(event) === 'string'"
                >{{ getEventContent(event) }}</template
              >
              <template v-else>
                <template
                  v-for="(segment, segmentIndex) in getEventContent(
                    event,
                  ) as Exclude<ReturnType<typeof getEventContent>, string>"
                  :key="segmentIndex"
                  ><a
                    v-if="segment.type === 'link'"
                    :href="segment.href"
                    rel="noopener noreferrer"
                    class="underline decoration-zinc-400 underline-offset-2"
                    >{{ segment.value }}</a
                  ><template v-else>{{ segment.value }}</template></template
                >
              </template>
            </p>

            <img
              v-if="getLifelineEventImage(event)"
              :src="getLifelineEventImage(event)!.src"
              :alt="getLifelineEventImage(event)!.alt"
              loading="lazy"
              class="mt-2 max-w-[18rem] rounded"
            />
          </div>
        </div>

        <img
          v-for="photo in marker.photos ?? []"
          :key="photo.src"
          :src="photo.src"
          :alt="photo.alt"
          loading="lazy"
          class="mt-2 max-w-[18rem] rounded"
        />

        <p
          v-if="marker.mentors?.length"
          class="mt-2 text-[13px] leading-[1.6] text-zinc-500"
        >
          {{
            marker.mentors
              .map((person) =>
                person.role ? `${person.name} (${person.role})` : person.name,
              )
              .join(", ")
          }}
        </p>

        <p
          v-if="marker.met?.length"
          class="mt-1 text-[13px] leading-[1.6] text-zinc-500"
        >
          Met: {{ marker.met.map((person) => person.name).join(", ") }}
        </p>
      </li>
    </ol>
  </div>
</template>
