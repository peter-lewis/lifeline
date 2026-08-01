<script setup lang="ts">
import { peterLifeline } from "~/lib/peter"

/**
 * This site's own source. The repo is currently private, so this link
 * 404s for anyone signed out — it resolves the moment it goes public.
 */
const REPO = "https://github.com/peter-lewis/lifeline"
</script>

<template>
  <LifelineShell>
    <!--
      Track filtering. The provider wraps the whole page rather than just
      the stage: the switches live in the footer legend and the events
      they control live in the timeline, so it has to sit above both. It
      renders no element of its own either.
    -->
    <LifelineTracksProvider>
      <!--
        The only Nuxt-aware component on the page. It provides the theme
        bridge that the fireworks easter egg and the switcher read, and
        renders no element of its own — so the shell's flex layout still
        sees nav / stage / footer as direct children.
      -->
      <LifelineNuxtTheme>
        <!-- One nav item, matching upstream. The nav's capped inner
             container is also what the rail aligns its start and end to. -->
        <LifelineNav logo-href="/" logo-label="Peter Lewis — Lifeline">
          <template #logo>
            <PeterLogo class="h-5 w-auto" />
          </template>

          <a
            :href="REPO"
            target="_blank"
            rel="noopener noreferrer"
            class="text-sm text-zinc-500 transition-colors duration-300 hover:text-black dark:hover:text-white"
          >
            GitHub
          </a>
        </LifelineNav>

        <LifelineStage>
          <Lifeline
            :markers="peterLifeline.markers"
            :birth-year="peterLifeline.birthYear"
            :title="peterLifeline.name"
            class="h-full"
          />
        </LifelineStage>

        <!--
          Legend keys the three event dots. Credits sits here rather than in
          the nav: the CC BY / CC BY-SA images require attribution, so the
          link has to stay reachable even as the chrome gets minimal.
        -->
        <LifelineFooter>
          <div class="flex items-center gap-6">
            <ThemeSwitcher />
            <LifelineLegend />
            <NuxtLink
              to="/credits"
              class="hidden text-[13px] text-zinc-500 transition-colors duration-300 hover:text-black sm:block dark:hover:text-white"
            >
              Credits
            </NuxtLink>
          </div>
          <CopyCommand
            command="npx shadcn-vue add https://www.peterlewis.dev/r/personal.json"
          />
        </LifelineFooter>
      </LifelineNuxtTheme>
    </LifelineTracksProvider>
  </LifelineShell>
</template>
