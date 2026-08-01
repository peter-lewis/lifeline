import { inject, type InjectionKey } from "vue"
import type { LifelineEventImage } from "./types"

export interface LifelineHoverImageApi {
  show: (image: LifelineEventImage) => void
  hide: () => void
}

export const LIFELINE_HOVER_IMAGE: InjectionKey<LifelineHoverImageApi> = Symbol(
  "lifeline-hover-image",
)

export function useLifelineHoverImage() {
  return inject(LIFELINE_HOVER_IMAGE, null)
}
