import { inject, type InjectionKey } from "vue"

/**
 * The timeline's only opinion about theming.
 *
 * The fireworks easter egg needs to know whether the page is currently
 * light, and to force it dark for the duration of the show. That was the
 * single reason the component depended on `@nuxtjs/color-mode`, which
 * made an otherwise plain Vue 3 component Nuxt-only.
 *
 * Instead the host provides this two-method bridge. Nothing is injected
 * by default: `useLifelineTheme()` returns null, the fireworks still
 * play, and they simply don't dim the page first. Wire it up and you get
 * the full effect.
 */
export interface LifelineThemeApi {
  /** The theme actually in effect right now. */
  resolved: () => "light" | "dark"
  /** Ask the host to switch. */
  set: (theme: "light" | "dark") => void
}

export const LIFELINE_THEME: InjectionKey<LifelineThemeApi> =
  Symbol("lifeline-theme")

export function useLifelineTheme() {
  return inject(LIFELINE_THEME, null)
}
