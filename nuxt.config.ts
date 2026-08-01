import tailwindcss from "@tailwindcss/vite"

/**
 * One source for the strings that appear in the tab, in search results and
 * in a shared link's card — they drift apart the moment they are typed out
 * in more than one place.
 */
const SITE_TITLE = "Lifeline of Peter Lewis: Software Engineer"
const SITE_DESCRIPTION =
  "How I got into computers, 1984 to now — first consoles, first builds, first jobs, and the people along the way."
const SITE_IMAGE_ALT =
  "A horizontal timeline opening on 1984: being born in Raleigh, the first Macintosh, the Atari 2600, and a first dial-up BBS."
const SITE_URL = "https://www.peterlewis.dev"
/** Attribution on the card. The @ is required — a bare handle is ignored. */
const X_HANDLE = "@creathir"

export default defineNuxtConfig({
  compatibilityDate: "2026-07-29",
  devtools: { enabled: false },
  modules: ["@nuxtjs/color-mode"],
  css: ["~/assets/css/main.css"],
  vite: { plugins: [tailwindcss()] },
  typescript: { strict: true },

  // `classSuffix: ""` reproduces next-themes' `attribute="class"`: the
  // bare `dark` class lands on <html>, which is what the
  // `@custom-variant dark (&:is(.dark *))` in main.css keys off. The
  // module inlines a pre-hydration script, so the theme resolves before
  // first paint and there is no light flash.
  colorMode: {
    classSuffix: "",
    preference: "system",
    fallback: "light",
    storageKey: "lifeline-theme",
  },

  app: {
    head: {
      title: SITE_TITLE,
      /**
       * Without this the document has no declared language at all, which
       * costs a Lighthouse accessibility point and, worse, leaves screen
       * readers to guess a voice for 173 events of English prose.
       */
      htmlAttrs: { lang: "en" },
      /**
       * Marks the document as script-capable before the body paints, so
       * `.js .lifeline-static` can hide the server-rendered biography
       * that `LifelineStatic` ships for crawlers. Inline and synchronous
       * on purpose — deferred, the static document would paint for a
       * frame before hydration swapped in the timeline.
       */
      script: [
        { innerHTML: "document.documentElement.classList.add('js')" },
      ],
      link: [
        { rel: "icon", type: "image/svg+xml", href: "/icon.svg" },
        /**
         * Geist is otherwise discovered only when the stylesheet is
         * parsed and the @font-face is matched, which puts it a full
         * round trip behind the CSS. It typesets every word on the
         * timeline, so that delay lands directly on LCP.
         * `crossorigin` is required even same-origin: fonts are fetched
         * in CORS mode, and without it the preload is discarded and
         * fetched a second time.
         */
        {
          rel: "preload",
          as: "font",
          type: "font/woff2",
          href: "/fonts/Geist-Variable.woff2",
          crossorigin: "anonymous",
        },
        // NOTE: canonical is deliberately NOT here. In `app.head` it
        // applies to every route, so /credits declared itself a duplicate
        // of the homepage and asked to be dropped from the index. Each
        // page sets its own via `useHead`.
      ],
      /**
       * Absolute URLs throughout: crawlers do not resolve relative paths,
       * and a relative og:image is the usual reason a card renders with no
       * picture.
       */
      meta: [
        { name: "description", content: SITE_DESCRIPTION },

        { property: "og:type", content: "website" },
        { property: "og:site_name", content: "Peter Lewis" },
        { property: "og:title", content: SITE_TITLE },
        { property: "og:description", content: SITE_DESCRIPTION },
        { property: "og:url", content: SITE_URL },
        { property: "og:image", content: `${SITE_URL}/og.png` },
        { property: "og:image:type", content: "image/png" },
        { property: "og:image:width", content: "2400" },
        { property: "og:image:height", content: "1260" },
        { property: "og:image:alt", content: SITE_IMAGE_ALT },

        // summary_large_image is what gives the 1.91:1 banner rather than
        // a thumbnail squeezed beside the text.
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:site", content: X_HANDLE },
        { name: "twitter:creator", content: X_HANDLE },
        { name: "twitter:title", content: SITE_TITLE },
        { name: "twitter:description", content: SITE_DESCRIPTION },
        { name: "twitter:image", content: `${SITE_URL}/og.png` },
        { name: "twitter:image:alt", content: SITE_IMAGE_ALT },
      ],
    },
  },
})
