# Lifeline for Vue

A timeline component for the stories that unfold over time — a career, a company, a journey.

Lifeline lays milestones on a single rail: horizontal and scrubbed by scroll on desktop, vertical on mobile. Years carry events, links, and the people who mattered; media attaches as hover reveals or floating cards that expand into a lightbox. On first load, an intro draws the rail across the years.

It ships as a [shadcn registry](https://www.shadcn-vue.com/docs/registry.html) — the source lands in your codebase, so every easing, breakpoint, and class is yours to change.

This is a Vue 3 port of [evilrabbit/lifeline](https://github.com/evilrabbit/lifeline), which is React and Next.js. The layout maths, intro choreography, scrub physics, and interaction rules are ported rather than reinterpreted: on a 1440×900 viewport both settle the rail at the same `translate3d(-6274px, 0, 0)`.

**Live demo:** [lifeline-peter-lewis.vercel.app](https://lifeline-peter-lewis.vercel.app)

## Install

**Starting from nothing?** This gets you a page that runs, framing included:

```bash
npx shadcn-vue@latest add https://lifeline-peter-lewis.vercel.app/r/page.json
```

Components, starter data, the shell, and a route at `pages/index.vue`. If that route already exists, the CLI asks before touching it.

**Already have a page?** Take the shell without the route, so the rail still sits inset and aligned inside your own layout:

```bash
npx shadcn-vue@latest add https://lifeline-peter-lewis.vercel.app/r/shell.json
```

**Just want the data template?**

```bash
npx shadcn-vue@latest add https://lifeline-peter-lewis.vercel.app/r/personal.json
```

Or just the component system, no starter and no framing:

```bash
npx shadcn-vue@latest add https://lifeline-peter-lewis.vercel.app/r/lifeline.json
```

Two optional extras — the sun/moon toggle, and the Nuxt theme bridge it drives:

```bash
npx shadcn-vue@latest add https://lifeline-peter-lewis.vercel.app/r/theme-switcher.json
npx shadcn-vue@latest add https://lifeline-peter-lewis.vercel.app/r/nuxt-theme.json
```

Any item installs the components into `components/lifeline/`, the data helper into `lib/lifeline-data.ts`, adds the intro keyframes to your CSS, and installs `@lucide/vue`, `clsx`, and `tailwind-merge`.

### Shorter: register a namespace

Add one line to your `components.json` and the URLs go away:

```json
{
  "registries": {
    "@lifeline": "https://lifeline-peter-lewis.vercel.app/r/{name}.json"
  }
}
```

```bash
npx shadcn-vue@latest add @lifeline/personal
npx shadcn-vue@latest add @lifeline/page
```

> **Why not `peter-lewis/lifeline/personal`?** The React CLI (shadcn 4.x) resolves that bare `owner/repo/item` form by fetching a root `registry.json` from `raw.githubusercontent.com`. `shadcn-vue` (2.8.1) has no GitHub resolver — it supports full URLs and `@namespace` entries from `registries`, which is what the block above uses. This repo's `registry.json` already sits at the root in the shape that resolver expects, so the short form should work unchanged if shadcn-vue adds it.

## Use

Define a timeline as milestones keyed by year, and render it:

```vue
<script setup lang="ts">
import { defineLifeline } from "@/lib/lifeline-data"

const life = defineLifeline({
  slug: "web",
  name: "The World Wide Web",
  birthYear: 1989,
  endYear: 2026,
  description: "From a memo at CERN to everywhere at once.",
  milestones: {
    1989: {
      id: "proposal",
      events: ["Tim Berners-Lee circulated a proposal. 'Vague, but exciting.'"],
    },
    1991: {
      id: "first-site",
      events: [
        {
          text: "The first website went live.",
          image: { src: "/moments/cern.jpg", alt: "info.cern.ch" }, // hover reveal
        },
      ],
    },
    2007: {
      id: "mobile",
      events: ["The iPhone put the Web in a pocket."],
      photos: [
        // always-visible floating card — drag it, tap to expand;
        // add `video` for a muted looping clip
        { src: "/moments/pocket.jpg", alt: "The Web, pocket-sized" },
      ],
    },
    2026: {
      id: "fireworks",
      events: [{ text: "It kept going. 🎆", effect: "fireworks" }],
    },
  },
})
</script>

<template>
  <LifelineShell>
    <!-- Not decoration: the rail measures its start and end from this
         nav, which is what keeps it inset from the viewport instead of
         running edge to edge. That span is what the intro draws. -->
    <LifelineNav logo-label="Home">
      <template #logo><YourLogo class="h-6 w-6" /></template>
    </LifelineNav>

    <LifelineStage>
      <Lifeline
        :markers="life.markers"
        :birth-year="life.birthYear"
        :title="life.name"
        class="h-full"
      />
    </LifelineStage>

    <LifelineFooter>
      <LifelineLegend />
    </LifelineFooter>
  </LifelineShell>
</template>
```

The layout switches automatically at the `md` breakpoint: horizontal scroll-scrubbed timeline above it, vertical scrolling timeline below.

### Props

| Prop | Type | |
| --- | --- | --- |
| `markers` | `LifelineMarker[]` | Required. `defineLifeline` returns these from your milestones. |
| `birthYear` | `number` | Required. Year zero for the age row and the axis start. |
| `title` | `string` | Becomes the `aria-label` on the timeline region. Defaults to `"Lifeline"`. |
| `mode` | `"auto" \| "page" \| "embed"` | Whether the timeline is the page or a module inside one. Defaults to `"auto"`, which measures. |
| `class` | `string` | Merged onto the timeline's root after its own `pt-5` — `h-full` is what you want inside `LifelineStage`. |

The shell pieces, all of which pass `class` through:

| Component | Props | |
| --- | --- | --- |
| `LifelineShell` | `class` | The `h-dvh` column that clips overflow. |
| `LifelineNav` | `logoHref`, `logoLabel`, `class`, `containerClass`, `#logo` slot | The `#logo` slot goes inside the marked anchor — the rail starts at its left edge. Default slot lands on the right. |
| `LifelineStage` | `class` | The `<main>`. Clears the fixed nav and hands scrolling to the horizontal scrub above `md`. |
| `LifelineFooter` | `class`, `containerClass` | Where `LifelineLegend` usually goes. |

`containerClass` overrides the width cap on the nav and the footer. Change it on **both** — one constant is shared between them, and the rail's end follows the nav, so a mismatch shows up as a rail that stops short of the footer's edge.

### What a milestone can carry

| Field | What it does |
| --- | --- |
| `events` | Strings, segment arrays, or `{ text, image?, effect?, track? }`. `image` shows on hover (desktop) / tap (mobile); `video` on the image makes it a looping clip. `effect: "fireworks"` hides a WebGL easter egg behind a click. |
| `photos` | Always-visible media cards scattered over the timeline — tilted like a notebook, draggable, tap-to-expand. `x` (0–1 across the year's slot), `y`, `rotate`, `width` optional. |
| `badges` | Small images above the events (flags, logos). |
| `companies` | Inline organization marks, optionally carrying a `track` so they filter with it — register logos once via `registerCompanyIcons({ acme: { icon: AcmeIcon } })`; unregistered ids fall back to the name's initial in a ring. |
| `mentors` / `met` | People rows with portraits along the rail. They filter as one thread, `influence`, rather than per person. |
| `age` | Override the computed age label (e.g. `"QF"`, `"F"` for a tournament). |

### Tracks

An addition to the original. Events may carry a `track`, rendered as a small coloured dot and keyed by `LifelineLegend`:

```ts
{ track: "work", text: "Shipped the thing." }
```

`"tech" | "work" | "life"` ship by default, plus `"influence"` for the people row. They exist so several threads can braid through the same years and still be told apart at a glance.

### Theming

The component has one opinion about themes, and it is optional. The fireworks easter egg wants to dim the page for the show, so it asks the host through a provide/inject bridge:

```ts
import { LIFELINE_THEME } from "@/components/lifeline/lifeline-theme"

provide(LIFELINE_THEME, {
  resolved: () => (isDark.value ? "dark" : "light"),
  set: (theme) => { isDark.value = theme === "dark" },
})
```

Provide nothing and the fireworks still play — they simply don't dim first. On Nuxt, install the `nuxt-theme` item for a ready-made bridge over `@nuxtjs/color-mode`.

### Embedding in a page

A full-page timeline owns the wheel — that's the point of it. A timeline sitting in the middle of a page that has its own content must not, so give it `mode="embed"` and a height:

```vue
<div class="h-[600px]">
  <Lifeline mode="embed" class="h-full" :markers="life.markers" :birth-year="life.birthYear" />
</div>
```

Scroll with the pointer over it and the rail runs sideways instead of the page running down. When the rail runs out, the wheel goes back to the page. Nothing is pinned and there is no tall spacer.

Two details worth knowing:

- **A gesture already in flight is never captured.** Flick the page and the timeline lets it pass; the next deliberate scroll is the one that scrubs. Symmetrically, a flick that eats the last of the rail stops there instead of spilling into the page.
- **The height is yours.** Nothing measures it. Timelines carrying photos and people rows want roughly 700–800px. A track taller than its box top-aligns and clips its longest column at the bottom rather than centring and clipping the label row off the top.

### Alignment with your site chrome

On desktop the timeline measures where to begin and end from your navigation, so the rail lines up with the rest of the page instead of running to the viewport edges:

| Marker | Effect |
| --- | --- |
| `data-site-nav-logo` | The rail's first marker starts at this element's left edge. |
| `data-site-nav-inner` | The rail ends 24px inside this element's right edge. Cap it — `mx-auto max-w-5xl px-6` on the demo — and the timeline inherits that width. |

Both are read from the document on mount and re-read on resize, so the nav can live anywhere in the tree. Without the markers the rail falls back to the stage's own box.

## Requirements

Vue 3 with Tailwind CSS v4. The core is framework-agnostic — no Nuxt import anywhere in `components/lifeline/`. The `theme-switcher` and `nuxt-theme` items are the only Nuxt-flavoured pieces, and `nuxt-theme` is the only file that imports anything Nuxt-specific.

Geist is assumed by `.lifeline-typeset`; override `--lifeline-font` to typeset it in something else.

## Differences from upstream

- Vue 3 `provide`/`inject` replaces React context for the hover-image and fireworks providers.
- Theme access is a host-provided bridge rather than a hard `next-themes` dependency.
- `@lucide/vue` replaces `lucide-react`; `@nuxtjs/color-mode` replaces `next-themes` in the optional adapter.
- Geist is self-hosted from the `geist` package rather than `next/font`.
- `cn` ships inside the component rather than as a `registryDependencies: ["utils"]`, because shadcn-vue's stock `utils` type-imports `@tanstack/vue-table`.
- Adds the `track` system and its legend.
- The legend doubles as a filter, over four threads: the three event tracks plus `influence`, the people row. Wrap the page in `LifelineTracksProvider` and each legend entry becomes a toggle; a switched-off thread folds its entries away entirely — gap included — and the year keeps a single dot per hidden thread beside its number, rather than one per entry. Company badges and photographs may carry a `track` of their own and follow it directly; without one they follow whether their year has any visible event left. The provider is optional — with none mounted, `useLifelineTracks()` returns `null`, the legend renders as a plain key, and every event draws in full.
- `align-items: safe center` is applied in page mode too, not only when embedded — a page-mode timeline in a window under ~720px tall clipped its entire Age/Years header.

## Develop

This repo is the registry and the demo:

```bash
pnpm install
pnpm dev                        # demo at localhost:3000
pnpm typecheck
npx shadcn-vue@latest build     # rebuilds public/r/*.json from registry.json
```

Working on this repo — content rules, the mandatory registry rebuild, and the traps that have caught people — is written up in [CLAUDE.md](CLAUDE.md).

`registry.json` is the source of truth. Every file entry carries an explicit `target` — without it the CLI routes files by `type` into the consumer's `lib/` and `composables/` aliases, which breaks the relative imports inside `components/lifeline/`.

## Credits

The timeline component is a port of [evilrabbit/lifeline](https://github.com/evilrabbit/lifeline) by Evil Rabbit, MIT licensed.

Hardware photography on the demo comes from Wikimedia Commons under public domain or Creative Commons free licences — see [/credits](https://lifeline-peter-lewis.vercel.app/credits) for per-image attribution.

## License

[MIT](./LICENSE)
