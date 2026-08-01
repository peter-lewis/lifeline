# Working on this repo

This is two things at once: Peter Lewis's personal timeline, and the
shadcn-vue registry that publishes the component behind it. A change to
the content ships to a real biography; a change to the components ships to
anyone who installs the registry. Both are public.

Live at <https://www.peterlewis.dev> (`lifeline-nuxt.vercel.app`
still resolves and should keep working).

## Adding to the timeline

All content lives in **`lib/peter.ts`**, a map keyed by year. `defineLifeline`
fills in every year between `birthYear` and `endYear`, so you only write the
years that have something in them — quiet years still get their narrow slot
on the rail automatically. Don't add empty year entries.

```ts
2019: {
  id: "glg",                                  // unique, kebab-case
  companies: [{ id: "apple", name: "Apple", track: "tech" }],
  events: [
    { track: "work", text: "Started at GLG on 1 July." },
    {
      track: "tech",
      text: "A Ryzen 3900X in August.",
      image: { src: "/images/hardware/x.jpg", alt: "..." },  // hover / tap-to-open
    },
  ],
  mentors: [{ name: "Ted Patrick", role: "Conference systems" }],
},
```

### The four threads

Events carry a `track`, read off the footer legend and filterable there:

| Track | What belongs in it |
| --- | --- |
| `tech` | Consoles, computers, phones, connections, operating systems |
| `work` | Jobs, businesses, and the things I shipped |
| `life` | Family, church, travel, and the things that aren't computers |
| `influence` | Not an event track — the `mentors` / `met` rows, filtered as one |

`companies` and `photos` may each carry their own `track`, and then follow
it directly: switch Tech off and a hardware badge goes even if that year's
Work events are still on screen. Without one they fall back to "show while
this year has any visible event left". **People never carry a track** — they
are the `influence` thread, one switch for all of them. Don't reintroduce
per-person tracks; that model was tried and removed.

### Rules for content

These are not style preferences. Getting them wrong has caused real
problems in this repo.

- **Never invent a detail.** Not a date, not a product, not a feeling, not
  a tidy closing line. If the material doesn't say it, leave it out and
  ask. Fabrications have been caught here repeatedly and every one had to
  be reverted.
- **Never add a photo that wasn't specifically pointed at.** If you pull a
  date range and find more than was asked for, show what's there and let
  the owner choose. A confidential work whiteboard was once committed and
  deployed this way; it required rewriting git history to remove.
- **Never commit anything confidential** — internal architecture, customer
  names, credentials. This repo is going public.
- Write in first person, plain, past tense. Match the surrounding voice:
  short factual sentences, no salesmanship, no summarising flourish.
- Spans go on the year they *start*, phrased to carry the end
  ("…and ran it until we moved in 2021"), because the axis is years.

## After any change

```bash
pnpm typecheck                    # nuxt typecheck
npx shadcn-vue@latest build       # REQUIRED — regenerates public/r/*.json
```

**The registry rebuild is not optional.** `public/r/*.json` embeds the
literal source of every file it ships, including `lib/peter.ts` and
`pages/index.vue`. Skip it and the site updates while the published
registry serves the old content.

Consumers can install by full URL, or by registering a namespace in their
own `components.json` (`"@lifeline": ".../r/{name}.json"`) and then running
`add @lifeline/personal`. The bare `owner/repo/item` form that the React
CLI supports needs a GitHub resolver that shadcn-vue 2.8.1 does not have;
keeping `registry.json` at the repo root with repo-relative `path` values
is what would make it work if that lands.

`registry.json` is the source of truth for what ships. Every file entry
needs an explicit `target` — without it the CLI routes files by `type`
into the consumer's `lib/` and `composables/` aliases and the relative
imports inside `components/lifeline/` break. Add new component files there
too, or installers won't get them.

Deploy:

```bash
vercel deploy --prod --yes --scope peterlewis-projects-f0d1873c
```

## Verifying

Check **both layouts** — they are separate component trees, and a fix to
one does not touch the other:

- Desktop `LifelineDesktop.vue` → `LifelineMarkerColumn.vue`, at 1440×900
- Mobile `LifelineVertical.vue` → `LifelineVerticalEntry.vue` →
  `LifelineVerticalEvent.vue`, at ~430×860

Also test a **short** desktop window (~660px tall). A page-mode timeline
under roughly 720px once clipped its entire Age/Years header; that's what
`align-items: safe center` in `LifelineDesktop.vue` guards, and it is easy
to regress without noticing at 900px.

### Measurement traps

Three ways browser checks have lied in this repo:

- **`innerText` still returns text inside a collapsed box.** Folded content
  sits in `overflow: hidden` at zero height and reads back as present.
  Assert on geometry (`getBoundingClientRect`, computed
  `grid-template-rows`) instead.
- **Clicking several legend chips in one tick breaks rAF sampling** and
  makes a working animation look like it popped. Stagger the clicks, or
  assert on start and end state rather than frames.
- **`pnpm typecheck` can exit clean without having run.** If a result looks
  suspiciously perfect, prove the harness works: introduce a deliberate
  type error, confirm it's caught, then revert.

## Things that will bite you

- `noUncheckedIndexedAccess` is on. Indexing an array gives `T | undefined`.
  Fix the code; don't loosen the flag.
- Nuxt auto-imports Vue's `effect`. A local named `effect` gets shadowed in
  templates — the existing code uses `eventEffect` / `activeEffect`.
- `withDefaults` is hoisted out of `setup()`, so a default factory can't
  close over a local const. Inline it.
- `cn` is local (`components/lifeline/cn.ts`), not shadcn-vue's `utils`,
  whose stock version type-imports `@tanstack/vue-table`.
- `getMarkerWidth` treats content as **binary**: a year showing anything is
  ~290–420px, a year showing nothing is 80px. It never scales with how much
  is in the year.
- Animating to an intrinsic size needs `grid-template-rows: 0fr → 1fr`
  (`LifelineCollapse.vue`); `height: auto` will not transition. Keep the
  content's margin *inside* the fold or the gap survives the collapse.
- Don't read layout during a width transition. `getViewportCoverage` in a
  per-frame loop cost ~400ms of forced reflow; the rail anchor now computes
  its destination from the width arrays and only writes a transform.

## Images and licensing

Hardware photography is Wikimedia Commons, and must be public domain, CC0,
CC BY, or CC BY-SA. CC BY and CC BY-SA carry a legal attribution
requirement, which is why `/credits` is a real page. Any new image needs an
entry in `lib/image-credits.ts` with source, author, and licence. Don't
add copyrighted box art, screenshots, or video — that would undo the audit
the credits page represents.
