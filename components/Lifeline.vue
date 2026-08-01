<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue"
import { cn } from "@/components/lifeline/cn"
import LifelineDesktop from "@/components/lifeline/LifelineDesktop.vue"
import LifelineFireworksProvider from "@/components/lifeline/LifelineFireworksProvider.vue"
import LifelineStatic from "@/components/lifeline/LifelineStatic.vue"
import LifelineVertical from "@/components/lifeline/LifelineVertical.vue"
import { LIFELINE_MOBILE_BREAKPOINT } from "@/components/lifeline/lifeline-utils"
import type { LifelineProps } from "@/components/lifeline/types"

const props = withDefaults(defineProps<LifelineProps>(), {
  title: "Lifeline",
  mode: "auto",
})

/**
 * `null` until the breakpoint is measured on the client. Rendering either
 * layout before that would pick one from the server's guess and then
 * swap it under the reader — and the desktop layout's whole intro would
 * be spent during the swap.
 *
 * This is also the only state the server ever renders in, so what it
 * renders is the entire page as far as a crawler is concerned. It used to
 * be an empty box, which is why none of the timeline was indexable;
 * `LifelineStatic` fills it with the same markers as a plain document.
 */
const isMobile = ref<boolean | null>(null)
let query: MediaQueryList | undefined
let update: (() => void) | undefined

onMounted(() => {
  // Matches Tailwind's md: breakpoint so JS and CSS can never disagree.
  query = window.matchMedia(`(min-width: ${LIFELINE_MOBILE_BREAKPOINT}px)`)
  update = () => {
    isMobile.value = !query!.matches
  }
  update()
  query.addEventListener("change", update)
})

onBeforeUnmount(() => {
  if (query && update) query.removeEventListener("change", update)
})
</script>

<template>
  <LifelineStatic
    v-if="isMobile === null"
    :markers="props.markers"
    :birth-year="props.birthYear"
    :title="props.title"
    :description="props.description"
  />

  <LifelineFireworksProvider v-else-if="isMobile">
    <!--
      Embedded, the vertical timeline gets its own bounded scroller: the
      consumer's height lands here, and this element becomes the scroll
      parent the vertical hook looks for. Native overscroll chaining then
      releases to the page at either end, which is exactly the embed
      contract. Page mode is left alone — the host's own scroller owns it
      there, and `h-full` would only fight it.
    -->
    <div
      :class="
        props.mode === 'embed'
          ? cn('lifeline-typeset h-full overflow-y-auto pt-5', props.class)
          : 'lifeline-typeset pt-5'
      "
    >
      <LifelineVertical
        :markers="props.markers"
        :birth-year="props.birthYear"
        :title="props.title"
        :mode="props.mode"
      />
    </div>
  </LifelineFireworksProvider>

  <LifelineFireworksProvider v-else>
    <LifelineDesktop
      :markers="props.markers"
      :birth-year="props.birthYear"
      :title="props.title"
      :mode="props.mode"
      :class="cn('lifeline-typeset pt-5', props.class)"
    />
  </LifelineFireworksProvider>
</template>
