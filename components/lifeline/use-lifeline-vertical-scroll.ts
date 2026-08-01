import { onBeforeUnmount, onMounted, ref, watch } from "vue"
import { clamp } from "./lifeline-utils"

function getScrollParent(element: HTMLElement | null): HTMLElement | null {
  let node = element?.parentElement ?? null

  while (node) {
    const { overflowY } = window.getComputedStyle(node)
    if (
      overflowY === "auto" ||
      overflowY === "scroll" ||
      overflowY === "overlay"
    ) {
      return node
    }
    node = node.parentElement
  }

  // Nothing on the way up scrolls, so the document does — which is the
  // ordinary case for a page-mode timeline in a page that just scrolls.
  // Returning null here left the whole rail `invisible` with no error.
  return (document.scrollingElement as HTMLElement | null) ?? null
}

interface LifelineVerticalScrollOptions {
  /**
   * Embedded, the timeline opens at its start rather than where a skipped
   * intro would have settled it — the reader is arriving at a module in a
   * page, not returning to a timeline that already played.
   */
  isEmbed?: () => boolean
  introLocked?: () => boolean
  introAnimating?: () => boolean
  introSkipped?: () => boolean
  introRailMs?: () => number
  introGetTrackProgress?: (elapsedMs: number) => number
  onIntroSettleComplete?: () => void
  onIntroScrollStart?: () => void
}

export function useLifelineVerticalScroll(
  markerCount: () => number,
  options: LifelineVerticalScrollOptions = {},
) {
  const sectionEl = ref<HTMLElement | null>(null)
  const isLayoutReady = ref(false)

  const entryEls: (HTMLElement | null)[] = []
  let maxScroll = 0
  let scrollParent: HTMLElement | null = null
  let initialized = false
  let introStarted = false
  let introScrollId = 0
  let introScrollStart = 0
  let introWasAnimating = false
  let scheduleMeasure: () => void = () => {}

  const isEmbed = () => options.isEmbed?.() ?? false
  const introLocked = () => options.introLocked?.() ?? false
  const introAnimating = () => options.introAnimating?.() ?? false
  const introSkipped = () => options.introSkipped?.() ?? false

  function setEntryRef(index: number, node: HTMLElement | null) {
    entryEls[index] = node

    if (index === markerCount() - 1 && node) scheduleMeasure()
  }

  function applyScroll(value: number) {
    if (!scrollParent) return
    scrollParent.scrollTop = clamp(value, 0, maxScroll)
  }

  function measureLayout() {
    const section = sectionEl.value
    if (!section) return 0

    scrollParent = getScrollParent(section)
    if (!scrollParent) return 0

    const heights = entryEls.map((entry) => entry?.offsetHeight ?? 0)
    if (heights.length < markerCount() || heights.some((h) => h <= 0)) return 0

    maxScroll = Math.max(
      0,
      scrollParent.scrollHeight - scrollParent.clientHeight,
    )

    return maxScroll
  }

  function runIntro() {
    if (!isLayoutReady.value) return
    if (introSkipped() || !introAnimating()) {
      cancelAnimationFrame(introScrollId)
      introScrollId = 0
      introStarted = false
      return
    }

    introWasAnimating = true
    const railMs = options.introRailMs?.() ?? 3200

    const step = (now: number) => {
      if (!introStarted) {
        introStarted = true
        introScrollStart = now
        options.onIntroScrollStart?.()
        sectionEl.value?.style.setProperty("--lifeline-intro-progress", "0")
        if (maxScroll > 0) applyScroll(0)
      }

      const elapsed = now - introScrollStart
      const progress = options.introGetTrackProgress
        ? clamp(options.introGetTrackProgress(elapsed), 0, 1)
        : clamp(elapsed / railMs, 0, 1)

      sectionEl.value?.style.setProperty(
        "--lifeline-intro-progress",
        String(progress),
      )

      if (maxScroll > 0) applyScroll(progress * maxScroll)

      if (progress < 1) {
        introScrollId = requestAnimationFrame(step)
        return
      }

      sectionEl.value?.style.setProperty("--lifeline-intro-progress", "1")
      if (maxScroll > 0) applyScroll(maxScroll)
      introScrollId = 0
    }

    introScrollId = requestAnimationFrame(step)
  }

  function settleIntro() {
    if (introSkipped() || introAnimating()) return
    if (!introWasAnimating) return

    introWasAnimating = false
    sectionEl.value?.style.removeProperty("--lifeline-intro-progress")
    options.onIntroSettleComplete?.()
  }

  let cleanup: (() => void) | undefined

  onMounted(() => {
    const section = sectionEl.value
    if (!section) return

    const max = measureLayout()
    scrollParent = getScrollParent(section)

    if (scrollParent && !initialized) {
      scrollParent.scrollTop = introSkipped() && !isEmbed() ? max : 0
      initialized = true
    }

    isLayoutReady.value = entryEls.every(Boolean)

    let frameId = 0

    const measure = () => {
      measureLayout()
      if (!scrollParent) return

      if (!(introAnimating() && introStarted)) {
        scrollParent.scrollTop = clamp(scrollParent.scrollTop, 0, maxScroll)
      }

      isLayoutReady.value =
        entryEls.length === markerCount() && entryEls.every(Boolean)
    }

    scheduleMeasure = () => {
      cancelAnimationFrame(frameId)
      frameId = requestAnimationFrame(measure)
    }

    scheduleMeasure()
    frameId = requestAnimationFrame(() => {
      measure()
      requestAnimationFrame(measure)
    })

    const resizeObserver = new ResizeObserver(scheduleMeasure)
    resizeObserver.observe(section)
    window.addEventListener("resize", scheduleMeasure)

    const isScrollLocked = () => introLocked() && introStarted

    const preventScroll = (event: Event) => {
      if (!isScrollLocked()) return
      event.preventDefault()
    }

    scrollParent?.addEventListener("wheel", preventScroll, { passive: false })
    scrollParent?.addEventListener("touchmove", preventScroll, {
      passive: false,
    })

    const boundParent = scrollParent

    cleanup = () => {
      cancelAnimationFrame(frameId)
      resizeObserver.disconnect()
      window.removeEventListener("resize", scheduleMeasure)
      boundParent?.removeEventListener("wheel", preventScroll)
      boundParent?.removeEventListener("touchmove", preventScroll)
      initialized = false
    }

    runIntro()
  })

  watch(
    [isLayoutReady, () => introAnimating(), () => introSkipped()],
    () => {
      cancelAnimationFrame(introScrollId)
      introScrollId = 0
      introStarted = false
      runIntro()
      settleIntro()
    },
    { flush: "post" },
  )

  onBeforeUnmount(() => {
    cancelAnimationFrame(introScrollId)
    cleanup?.()
  })

  return { sectionEl, setEntryRef, isLayoutReady }
}
