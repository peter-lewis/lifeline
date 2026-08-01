<script setup lang="ts">
import { computed, ref } from "vue"
import { Film, ImageIcon } from "@lucide/vue"
import { cn } from "./cn"
import LifelineEventText from "./LifelineEventText.vue"
import LifelineLightbox from "./LifelineLightbox.vue"
import {
  getLifelineEventEffect,
  getLifelineEventImage,
  getLifelineEventTrack,
  LIFELINE_TRACK_DOT,
} from "./lifeline-event-utils"
import { useLifelineFireworks } from "./lifeline-fireworks"
import type { LifelineLightboxStart } from "./lifeline-lightbox-types"
import { isLifelineTrackMuted, useLifelineTracks } from "./lifeline-tracks"
import type { LifelineEvent } from "./types"

/**
 * One event line. Touch layouts have no hover reveal, so an event with
 * attached media becomes tappable: the media expands into the lightbox
 * from the event's text, framed by the poster image's real aspect.
 */
const props = defineProps<{ event: LifelineEvent }>()

const fireworks = useLifelineFireworks()
// Not `effect` — Nuxt auto-imports Vue's `effect`, and the template
// would resolve the collision to that function instead of this computed.
const image = computed(() => getLifelineEventImage(props.event))
const eventEffect = computed(() => getLifelineEventEffect(props.event))
const track = computed(() => getLifelineEventTrack(props.event))

const tracks = useLifelineTracks()
const muted = computed(() => isLifelineTrackMuted(tracks, track.value))

const textEl = ref<HTMLElement | null>(null)
const lightboxStart = ref<LifelineLightboxStart | null>(null)
let aspect = 3 / 4

// The event text has no card geometry — synthesize a small seed centered
// on the text, carrying the media's aspect so the lightbox expands into
// the right frame.
function measureText(): LifelineLightboxStart | null {
  const el = textEl.value
  if (!el) return null
  const rect = el.getBoundingClientRect()
  const w = 96
  return {
    cx: rect.left + rect.width / 2,
    cy: rect.top + rect.height / 2,
    w,
    h: w * aspect,
  }
}

function openMedia() {
  const media = image.value
  if (!media || lightboxStart.value) return

  // The poster sets the frame; for videos it shares the clip's aspect.
  const probe = new window.Image()
  probe.src = media.src
  const open = () => {
    if (probe.naturalWidth > 0) {
      aspect = probe.naturalHeight / probe.naturalWidth
    }
    lightboxStart.value = measureText()
  }
  if (probe.complete) open()
  else {
    probe.onload = open
    probe.onerror = open
  }
}

function onClick() {
  if (muted.value) return
  if (image.value) openMedia()
  else if (eventEffect.value) fireworks?.launch(eventEffect.value)
}
</script>

<template>
  <!--
    Folds to nothing when its track is off — no dot, no line, no gap. What
    the year held is recorded once, as a dot beside the year itself.
  -->
  <div
    class="grid transition-[grid-template-rows,opacity] duration-300 ease-out"
    :style="{
      gridTemplateRows: muted ? '0fr' : '1fr',
      opacity: muted ? 0 : 1,
    }"
    :aria-hidden="muted ? 'true' : undefined"
  >
    <div class="min-h-0 overflow-hidden">
      <p
        ref="textEl"
        :class="
          cn(
            'mb-4 max-w-[18rem] text-left text-[14px] leading-[1.55] tracking-[-0.01em]',
            track && 'relative pl-4',
            (image || eventEffect) && !muted && 'cursor-pointer',
          )
        "
        @click="onClick"
      >
        <span
          v-if="track"
          :class="
            cn(
              'absolute left-0 top-[0.5em] h-1.5 w-1.5 rounded-full',
              LIFELINE_TRACK_DOT[track],
            )
          "
          aria-hidden="true"
        />
        <LifelineEventText :event="props.event" />
        <!-- Glued to the last word with a no-break space so the icon can
             never wrap onto a line of its own. -->
        <span v-if="image" class="whitespace-nowrap">
          {{ " " }}
          <Film
            v-if="image.video"
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

  <LifelineLightbox
    v-if="lightboxStart && image"
    :photo="image"
    :rotate="0"
    :start="lightboxStart"
    :get-home="measureText"
    @closed="lightboxStart = null"
  />
</template>
