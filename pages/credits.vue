<script setup lang="ts">
import { imageCredits } from "~/lib/image-credits"

/**
 * Its own canonical and description. Both used to be inherited from
 * `app.head`, which pointed every route's canonical at the homepage — so
 * this page asked Google to drop it, and the CC BY / CC BY-SA attribution
 * it exists to carry was unreachable from search.
 */
useHead({
  title: "Image credits — Peter Lewis",
  link: [{ rel: "canonical", href: "https://www.peterlewis.dev/credits" }],
  meta: [
    {
      name: "description",
      content:
        "Sources, authors and licences for the hardware photography on peterlewis.dev — Wikimedia Commons, public domain and Creative Commons.",
    },
  ],
})
</script>

<template>
  <div
    class="flex min-h-dvh flex-col bg-white text-black antialiased transition-colors duration-300 dark:bg-black dark:text-white"
  >
    <LifelineNav logo-href="/" logo-label="Peter Lewis — Lifeline">
      <template #logo>
        <PeterLogo class="h-5 w-auto" />
      </template>
      <NuxtLink
        to="/"
        class="text-sm text-zinc-500 transition-colors duration-300 hover:text-black dark:hover:text-white"
      >
        Back to the timeline
      </NuxtLink>
    </LifelineNav>

    <main class="mx-auto w-full max-w-5xl flex-1 px-6 pb-20 pt-28">
      <h1 class="text-[22px] font-medium tracking-[-0.01em]">Image credits</h1>
      <p class="mt-3 max-w-[42rem] text-[14px] leading-[1.6] text-zinc-500">
        Hardware photography comes from Wikimedia Commons. Everything below is
        public domain or under a Creative Commons free licence; the CC BY and
        CC BY-SA entries carry an attribution requirement, which this page
        satisfies. The 1997 website capture and the personal photographs
        from 2014, 2015 and 2019 are my own — no licence needed for those.
      </p>

      <p class="mt-4 max-w-[42rem] text-[14px] leading-[1.6] text-zinc-500">
        The timeline component itself is a Vue 3 / Nuxt port of
        <a
          href="https://github.com/evilrabbit/lifeline"
          target="_blank"
          rel="noopener noreferrer"
          class="underline decoration-zinc-400 underline-offset-2 transition-colors duration-300 hover:text-black hover:decoration-zinc-600 dark:decoration-zinc-700 dark:hover:text-white dark:hover:decoration-zinc-400"
          >evilrabbit/lifeline</a
        >, MIT licensed.
      </p>

      <ul class="mt-10 space-y-5">
        <li
          v-for="credit in imageCredits"
          :key="credit.file"
          class="grid gap-x-6 gap-y-1 border-t border-zinc-200/70 pt-5 text-[14px] leading-[1.55] transition-colors duration-300 sm:grid-cols-[13rem_1fr] dark:border-zinc-800/70"
        >
          <p class="font-medium">{{ credit.subject }}</p>
          <div class="text-zinc-500">
            <p>
              <a
                :href="credit.source"
                target="_blank"
                rel="noopener noreferrer"
                class="underline decoration-zinc-400 underline-offset-2 transition-colors duration-300 hover:text-black hover:decoration-zinc-600 dark:decoration-zinc-700 dark:hover:text-white dark:hover:decoration-zinc-400"
                >{{ credit.file }}</a
              >
            </p>
            <p class="mt-0.5 tabular-nums">
              {{ credit.author }} · {{ credit.licence }}
            </p>
          </div>
        </li>
      </ul>
    </main>
  </div>
</template>
