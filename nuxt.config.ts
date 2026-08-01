import tailwindcss from "@tailwindcss/vite"

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
      title: "Lifeline of Peter Lewis: Software Engineer",
      link: [{ rel: "icon", type: "image/svg+xml", href: "/icon.svg" }],
      meta: [
        {
          name: "description",
          content:
            "A timeline component for the stories that unfold over time — a career, a company, a journey. Ships as a shadcn registry.",
        },
      ],
    },
  },
})
