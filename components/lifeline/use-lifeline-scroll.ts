import { onBeforeUnmount, onMounted, ref, watch } from "vue"
import {
  LIFELINE_STICKY_LEFT,
  LIFELINE_STICKY_SHIELD_WIDTH,
} from "./lifeline-labels-shared"
import { clamp, snapToDevicePixel } from "./lifeline-utils"
import type { LifelineMode } from "./types"

const FADE_ZONE = 200
const FADE_ZONE_COARSE = 72
/**
 * Samples a CSS cubic-bezier curve, so the rail can be driven by the same
 * easing the column widths are using without reading either from the DOM.
 */
function cubicBezier(x1: number, y1: number, x2: number, y2: number) {
  const cx = 3 * x1
  const bx = 3 * (x2 - x1) - cx
  const ax = 1 - cx - bx
  const cy = 3 * y1
  const by = 3 * (y2 - y1) - cy
  const ay = 1 - cy - by

  const sampleX = (t: number) => ((ax * t + bx) * t + cx) * t
  const sampleY = (t: number) => ((ay * t + by) * t + cy) * t
  const slopeX = (t: number) => (3 * ax * t + 2 * bx) * t + cx

  return (x: number) => {
    let t = x
    for (let i = 0; i < 5; i += 1) {
      const slope = slopeX(t)
      if (slope === 0) break
      t -= (sampleX(t) - x) / slope
    }
    return sampleY(Math.min(1, Math.max(0, t)))
  }
}

/** Tailwind's `ease-out`, which is what the columns transition with. */
const EASE_OUT = cubicBezier(0, 0, 0.58, 1)
const LEFT_EXIT_FADE_ZONE = 400
const LEFT_EXIT_FADE_ZONE_COARSE = 160
const WHEEL_SPEED = 1.4
const WHEEL_VELOCITY_FRAME_MS = 16.67
const WHEEL_MOMENTUM_BLEND = 0.65
const DRAG_SPEED = 1
const TOUCH_DRAG_SPEED = 1.15
const TOUCH_GESTURE_LOCK_PX = 8
const NAV_HORIZONTAL_PADDING = 24
const MOMENTUM_FRICTION = 0.94
const MOMENTUM_MIN_VELOCITY = 0.025
const MOMENTUM_MIN_START = 0.08

/** Where the track starts when there is no host nav to align with. */
const LIFELINE_DEFAULT_START_INSET = 24

/** Page mode needs the stage to cover at least this much of the viewport. */
const PAGE_MODE_VIEWPORT_COVERAGE = 0.5
/** Scroll heights within this many px of the client height aren't scrollable. */
const PAGE_MODE_SCROLL_SLOP = 4
/** How long a resolved mode is trusted before it is measured again. */
const MODE_RESOLVE_STALE_MS = 250

/** A gap this long in the wheel stream ends one gesture and starts the next. */
const WHEEL_GESTURE_QUIET_MS = 120
/**
 * Embedded: once the rail bottoms out, the wheel keeps being swallowed
 * until the stream has been quiet this long. Trackpad inertia arrives as
 * one unbroken stream, so a fast flick that eats the last of the rail
 * dies here instead of spilling into the page behind it.
 */
const EMBED_BOUNDARY_QUIET_MS = 260
/**
 * …but never hold longer than this. Inertia decays; a finger or a wheel
 * that is still going does not, so a sustained scroll gets through.
 */
const EMBED_BOUNDARY_MAX_HOLD_MS = 900

/**
 * How early the sweep is armed, relative to the module entering view. A
 * couple of hundred pixels means it is already moving by the time it is
 * properly on screen, rather than starting cold under the reader's eyes.
 */
const EMBED_INTRO_ARM_MARGIN = "0px 0px 200px 0px"

function normalizeWheelDelta(event: WheelEvent) {
  let delta =
    Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY

  if (event.deltaMode === 1) delta *= 16
  if (event.deltaMode === 2) delta *= window.innerHeight

  return delta
}

function isInteractiveTarget(target: EventTarget | null) {
  // Pointer capture during drag retargets clicks to the section, so
  // anything clickable must opt out of drag-start here.
  return (
    target instanceof Element &&
    Boolean(target.closest("a, button, [data-lifeline-interactive]"))
  )
}

function isEditableTarget(target: EventTarget | null) {
  return (
    target instanceof Element &&
    Boolean(target.closest("input, textarea, select, [contenteditable]"))
  )
}

/** How much of the viewport this element currently covers, 0..1. */
function getViewportCoverage(element: HTMLElement) {
  const rect = element.getBoundingClientRect()
  const visibleX =
    Math.min(rect.right, window.innerWidth) - Math.max(rect.left, 0)
  const visibleY =
    Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0)
  if (visibleX <= 0 || visibleY <= 0) return 0

  return (visibleX * visibleY) / (window.innerWidth * window.innerHeight)
}

/**
 * Is there a vertical scroll behind this element for a released wheel to
 * drive? Walks out to the document, stopping at the first ancestor that
 * clips — a `LifelineShell` is `overflow-hidden`, so nothing escapes it.
 */
function hasReleasableScroll(section: HTMLElement) {
  let node = section.parentElement

  while (node) {
    const { overflowY } = window.getComputedStyle(node)

    if (overflowY === "hidden" || overflowY === "clip") return false

    if (
      (overflowY === "auto" ||
        overflowY === "scroll" ||
        overflowY === "overlay") &&
      node.scrollHeight > node.clientHeight + PAGE_MODE_SCROLL_SLOP
    ) {
      return true
    }

    node = node.parentElement
  }

  const doc = document.scrollingElement
  return Boolean(
    doc && doc.scrollHeight > doc.clientHeight + PAGE_MODE_SCROLL_SLOP,
  )
}

interface LifelineScrollOptions {
  mode?: () => LifelineMode
  isCoarsePointer?: () => boolean
  introLocked?: () => boolean
  introAnimating?: () => boolean
  introSkipped?: () => boolean
  introRailMs?: () => number
  introGetTrackProgress?: (elapsedMs: number) => number
  onIntroSettleComplete?: () => void
  onIntroScrollStart?: () => void
}

export function useLifelineScroll(
  markerCount: () => number,
  options: LifelineScrollOptions = {},
) {
  const sectionEl = ref<HTMLElement | null>(null)
  const trackEl = ref<HTMLElement | null>(null)
  const labelsEl = ref<HTMLElement | null>(null)

  const isLayoutReady = ref(false)
  const isEmbed = ref(false)
  const introArmed = ref(false)

  // Perf-critical state stays as plain locals — the equivalent of
  // React's useRef. Nothing here should trigger a re-render.
  const markerEls: (HTMLElement | null)[] = []
  let maxTranslate = 0
  let startInset = LIFELINE_DEFAULT_START_INSET
  let endInset = 0
  let translatePx = 0
  let initialized = false
  let dragging = false
  let gestureAxis: "x" | "y" | null = null
  let gestureStart = { x: 0, y: 0 }
  let dragOrigin = { x: 0, translate: 0 }
  let dragVelocity = 0
  let lastPointerSample = { x: 0, t: 0 }
  let activePointerId: number | null = null
  let momentumId = 0
  let settling = false
  let introWasAnimating = false
  let introScrollId = 0
  let introScrollStart = 0
  let introStarted = false
  let anchorId = 0
  let isEmbedNow = false
  let modeResolvedAt = 0
  let prefersReducedMotion = false
  let wheelStreamAt = 0
  let wheelGapMs = Number.POSITIVE_INFINITY
  let gestureStartedHere = false
  let gestureReleased = false
  let boundaryHitAt = 0
  let scheduleMeasure: () => void = () => {}

  const mode = () => options.mode?.() ?? "auto"
  const isCoarsePointer = () => options.isCoarsePointer?.() ?? false
  const introLocked = () => options.introLocked?.() ?? false
  const introAnimating = () => options.introAnimating?.() ?? false
  const introSkipped = () => options.introSkipped?.() ?? false

  function setMarkerRef(index: number, node: HTMLElement | null) {
    markerEls[index] = node

    if (index === markerCount() - 1 && node) scheduleMeasure()
  }

  function getLabelStageLeft(translate: number) {
    if (!sectionEl.value) return { isSticky: false, labelLeft: 0 }

    // Stage-relative: labels pin LIFELINE_STICKY_LEFT px inside the
    // section's own left edge, wherever the section sits on the page.
    const naturalLeft = startInset - translate
    const isSticky = naturalLeft <= LIFELINE_STICKY_LEFT

    return {
      isSticky,
      labelLeft: isSticky ? LIFELINE_STICKY_LEFT : naturalLeft,
    }
  }

  function applyLabelSticky(translate: number) {
    const labels = labelsEl.value
    const { isSticky, labelLeft } = getLabelStageLeft(translate)

    if (!labels) return { isSticky, labelLeft }

    if (isSticky) {
      // Derived from the track's snapped offset so the two transforms
      // cancel to exactly LIFELINE_STICKY_LEFT — the pinned labels
      // must not drift a fraction against the snapped track.
      const labelExtra =
        LIFELINE_STICKY_LEFT - snapToDevicePixel(startInset - translate)
      labels.style.transform = `translate3d(${labelExtra}px, 0, 0)`
      labels.classList.add("is-pinned")
    } else {
      labels.style.transform = ""
      labels.classList.remove("is-pinned")
    }

    return { isSticky, labelLeft }
  }

  function isScrollLocked() {
    return (introLocked() && introStarted) || settling
  }

  function updateFades() {
    if (settling) return

    /**
     * Edge fades are 43 more rect reads, and while a width transition is
     * in flight every one of them reflows the whole track. They are also
     * the least noticeable thing on screen during a 420ms collapse, so
     * they sit it out and the anchor runs one final pass at the end.
     */
    if (anchorId) return

    const section = sectionEl.value
    if (!section) return

    // All fade math is relative to the section's own box — the lifeline
    // may be embedded anywhere, not pinned to the viewport.
    const stageRect = section.getBoundingClientRect()
    const isCoarse = isCoarsePointer()
    const fadeZone = isCoarse ? FADE_ZONE_COARSE : FADE_ZONE
    const leftFadeZone = isCoarse
      ? LEFT_EXIT_FADE_ZONE_COARSE
      : LEFT_EXIT_FADE_ZONE

    /**
     * Every rect is read before any opacity is written.
     *
     * Interleaved, each write invalidates layout and the next read forces
     * it again — 43 reflows a frame. That costs nothing while the columns
     * are a fixed width, because the layout stays clean between reads, but
     * under the track filter's width transition it reflowed a 10,000px
     * track 43 times a frame and dropped a quarter-second on the floor.
     */
    const rects = markerEls.map((marker) =>
      marker ? marker.getBoundingClientRect() : null,
    )

    const opacities = rects.map((rect) => {
      if (!rect) return null

      const markerLeft = rect.left - stageRect.left
      const center = markerLeft + rect.width / 2

      let opacity = 1

      // Fade a marker out only as scrubbing carries it left of where
      // it rests at translate 0 — the first markers naturally live
      // inside the fade zone and must not open dimmed.
      const naturalLeft = markerLeft + translatePx
      const restLeft = Math.min(naturalLeft, leftFadeZone)
      if (markerLeft < restLeft) {
        opacity = markerLeft <= 0 ? 0 : markerLeft / restLeft
      }

      if (center > stageRect.width - fadeZone) {
        opacity = Math.min(opacity, (stageRect.width - center) / fadeZone)
      }

      if (isCoarse) {
        const readableLeft = LIFELINE_STICKY_SHIELD_WIDTH
        const readableRight = stageRect.width - 12
        const markerRight = rect.right - stageRect.left
        const visibleWidth =
          Math.min(markerRight, readableRight) -
          Math.max(markerLeft, readableLeft)
        const visibility = rect.width > 0 ? visibleWidth / rect.width : 0

        if (visibility >= 0.5) opacity = 1
      }

      return clamp(opacity, 0, 1)
    })

    markerEls.forEach((marker, index) => {
      const opacity = opacities[index]
      if (marker && opacity !== null && opacity !== undefined) {
        marker.style.opacity = String(opacity)
      }
    })
  }

  function applyTranslate(value: number) {
    const next = clamp(value, 0, maxTranslate)
    translatePx = next

    if (trackEl.value) {
      // Snapped only at the DOM boundary — translatePx stays float so
      // wheel/drag/settle physics never accumulate rounding.
      trackEl.value.style.transform = `translate3d(${snapToDevicePixel(
        startInset - next,
      )}px, 0, 0)`
    }

    applyLabelSticky(next)
    updateFades()
  }

  /**
   * Page mode or embedded? An explicit `mode` decides it outright.
   * `"auto"` measures: the timeline is the page only when it covers most
   * of the viewport *and* there is nothing behind it left to scroll.
   * Both halves matter — a full-bleed hero section on a long landing page
   * covers the viewport but must still hand the wheel back at the ends.
   *
   * Cached for MODE_RESOLVE_STALE_MS because this reads layout and the
   * wheel path calls it. `force` is for measure passes, which are already
   * doing layout work.
   */
  function resolveMode(force = false) {
    const section = sectionEl.value
    if (!section) return isEmbedNow

    const current = mode()

    if (current !== "auto") {
      const embed = current === "embed"
      if (embed !== isEmbedNow) {
        isEmbedNow = embed
        isEmbed.value = embed
      }
      return embed
    }

    const now = performance.now()
    if (!force && now - modeResolvedAt < MODE_RESOLVE_STALE_MS) {
      return isEmbedNow
    }
    modeResolvedAt = now

    const isPage =
      getViewportCoverage(section) >= PAGE_MODE_VIEWPORT_COVERAGE &&
      !hasReleasableScroll(section)

    if (isPage === !isEmbedNow) return isEmbedNow

    isEmbedNow = !isPage
    isEmbed.value = !isPage
    return isEmbedNow
  }

  /**
   * `forceModeResolve` is on for ordinary measure passes, which are rare
   * and want the freshest answer. The anchor loop turns it off: it runs
   * every frame for the length of a resize, page-versus-embed cannot
   * change underneath it, and re-resolving reads viewport geometry that
   * the in-flight width transition has just invalidated — which the trace
   * showed costing ~400ms of forced reflow across a single collapse.
   */
  function measureLayout(forceModeResolve = true) {
    const track = trackEl.value
    const section = sectionEl.value
    if (!track || !section) return 0

    const embed = resolveMode(forceModeResolve)
    const stageRect = section.getBoundingClientRect()

    const navLogo = document.querySelector("[data-site-nav-logo]")
    const navInner = document.querySelector("[data-site-nav-inner]")

    const logoLeft = navLogo
      ? navLogo.getBoundingClientRect().left - stageRect.left
      : null
    const navRight = navInner
      ? navInner.getBoundingClientRect().right -
        stageRect.left -
        NAV_HORIZONTAL_PADDING
      : null

    /**
     * A full-page lifeline always follows the host chrome. An embedded one
     * follows it only when the module actually spans it — a full-bleed
     * module lines its rail up with the logo and the container's right edge,
     * exactly as the full-page version does, while a timeline in a narrow
     * card has nothing to align to a nav sitting outside its own box and
     * measures itself instead.
     */
    const followChrome =
      !embed ||
      (logoLeft !== null &&
        navRight !== null &&
        logoLeft >= 0 &&
        navRight <= stageRect.width &&
        navRight > logoLeft)

    startInset =
      followChrome && logoLeft !== null ? logoLeft : LIFELINE_DEFAULT_START_INSET

    endInset =
      followChrome && navRight !== null
        ? navRight
        : // No chrome to align with, or none this module spans — end the
          // track at the stage's own right edge instead.
          stageRect.width - NAV_HORIZONTAL_PADDING

    const lastMarker = markerEls[markerCount() - 1]
    const lastMarkerRight = lastMarker
      ? LIFELINE_STICKY_SHIELD_WIDTH +
        lastMarker.offsetLeft +
        lastMarker.offsetWidth
      : track.scrollWidth

    maxTranslate = Math.max(0, startInset + lastMarkerRight - endInset)

    return maxTranslate
  }

  /**
   * Keep the year the reader is looking at pinned while every column
   * resizes underneath it.
   *
   * Filtering changes all the widths at once. Left alone the rail holds
   * its translate, so the whole timeline appears to rush toward 1984 —
   * the reader loses their place for no reason they can see.
   *
   * This runs entirely on arithmetic. An earlier version re-read the
   * anchor's `offsetLeft` every frame to inherit the CSS easing for free,
   * which was elegant and far too slow: a forced layout while the widths
   * are mid-transition relayouts the whole 10,000px track, and the trace
   * put it at ~180ms a go. Since the caller already knows both width
   * arrays, the rail's destination is a sum, and the curve is the same
   * `ease-out` the columns use — so nothing here touches the DOM but the
   * transform write.
   */
  function holdAnchorThroughResize(
    durationMs: number,
    prevWidths: number[],
    nextWidths: number[],
  ) {
    if (!trackEl.value || introAnimating()) return

    // Track-space left edge of marker `index`, before and after.
    const prefix = (widths: number[], index: number) => {
      let sum = 0
      for (let i = 0; i < index; i += 1) sum += widths[i] ?? 0
      return sum
    }

    // The year under the reader: the first whose right edge is still on
    // screen. Anything further left has already scrolled past. Derived
    // from the widths rather than measured, for the same reason.
    let anchorIndex = 0
    for (let index = 0; index < prevWidths.length; index += 1) {
      const left =
        startInset -
        translatePx +
        LIFELINE_STICKY_SHIELD_WIDTH +
        prefix(prevWidths, index)

      if (left + (prevWidths[index] ?? 0) > 0) {
        anchorIndex = index
        break
      }
    }

    // Holding the anchor still means moving the rail by exactly however
    // much the content to its left grew or shrank.
    const from = translatePx
    const to =
      from + prefix(nextWidths, anchorIndex) - prefix(prevWidths, anchorIndex)

    if (Math.abs(to - from) < 0.5) return

    const totalNext = nextWidths.reduce((sum, width) => sum + width, 0)
    const nextMax = Math.max(
      0,
      startInset + LIFELINE_STICKY_SHIELD_WIDTH + totalNext - endInset,
    )

    stopMomentum()
    dragVelocity = 0
    cancelAnimationFrame(anchorId)

    // `from` may sit beyond the shrunken track's new maximum, and clamping
    // to it on the first frame would snap before the animation began. Hold
    // the bound open for the duration; the final pass clamps for real.
    const heldMax = Math.max(maxTranslate, nextMax)
    const start = performance.now()

    const step = () => {
      const progress = Math.min(1, (performance.now() - start) / durationMs)

      maxTranslate = heldMax
      applyTranslate(from + (to - from) * EASE_OUT(progress))

      if (progress < 1) {
        anchorId = requestAnimationFrame(step)
        return
      }

      anchorId = 0

      // Guard off: re-measure for real, let the fades catch up on the
      // settled layout, and clamp — which the anchor frames were not.
      measureLayout()
      translatePx = clamp(translatePx, 0, maxTranslate)
      applyTranslate(translatePx)
    }

    anchorId = requestAnimationFrame(step)
  }

  function stopMomentum() {
    cancelAnimationFrame(momentumId)
    momentumId = 0
  }

  function startMomentum() {
    if (Math.abs(dragVelocity) < MOMENTUM_MIN_START) return

    stopMomentum()
    let lastFrameTime = performance.now()

    const step = (now: number) => {
      const dt = Math.min(now - lastFrameTime, 32)
      lastFrameTime = now

      const velocity = dragVelocity
      if (Math.abs(velocity) < MOMENTUM_MIN_VELOCITY) {
        dragVelocity = 0
        momentumId = 0
        return
      }

      const next = clamp(translatePx + velocity * dt, 0, maxTranslate)

      if (next !== translatePx) applyTranslate(next)

      if (next <= 0 || next >= maxTranslate) {
        // Coasting into an end counts as hitting it, so the next wheel
        // event starts its hold from the moment of contact rather than
        // restarting the clock.
        if (isEmbedNow && boundaryHitAt === 0) boundaryHitAt = performance.now()
        dragVelocity = 0
        momentumId = 0
        return
      }

      dragVelocity = velocity * Math.pow(MOMENTUM_FRICTION, dt / 16.67)
      momentumId = requestAnimationFrame(step)
    }

    momentumId = requestAnimationFrame(step)
  }

  // ---------------------------------------------------------------- intro

  function runIntro() {
    if (!isLayoutReady.value) return
    // Embedded, hold the sweep until the module is in view. Marker fades
    // are CSS animations that start the moment their class lands, so
    // applying it early would spend them below the fold.
    if (isEmbed.value && !introArmed.value) return

    if (introSkipped() || !introAnimating()) {
      cancelAnimationFrame(introScrollId)
      introScrollId = 0
      introStarted = false
      return
    }

    introWasAnimating = true
    const railMs = options.introRailMs?.() ?? 3200

    const step = (now: number) => {
      if (maxTranslate <= 0) {
        // Nothing to travel: a timeline that fits its stage has no rail to
        // sweep. Waiting for one spun this loop forever and left the intro
        // lock on, so run the intro out where it already is — the markers
        // and labels still get their fade, there is just no journey.
        if (!introStarted) {
          introStarted = true
          introScrollStart = now
          options.onIntroScrollStart?.()
        }
        sectionEl.value?.style.setProperty("--lifeline-intro-progress", "1")
        introScrollId = 0
        return
      }

      if (!introStarted) {
        introStarted = true
        introScrollStart = now
        options.onIntroScrollStart?.()
        sectionEl.value?.style.setProperty("--lifeline-intro-progress", "0")
        applyTranslate(0)
      }

      const elapsed = now - introScrollStart
      const progress = options.introGetTrackProgress
        ? clamp(options.introGetTrackProgress(elapsed), 0, 1)
        : clamp(elapsed / railMs, 0, 1)

      sectionEl.value?.style.setProperty(
        "--lifeline-intro-progress",
        String(progress),
      )
      applyTranslate(progress * maxTranslate)

      if (progress < 1) {
        introScrollId = requestAnimationFrame(step)
        return
      }

      sectionEl.value?.style.setProperty("--lifeline-intro-progress", "1")
      applyTranslate(maxTranslate)
      introScrollId = 0
    }

    introScrollId = requestAnimationFrame(step)
  }

  function settleIntro() {
    if (introSkipped() || introAnimating()) return
    if (!introWasAnimating) return
    introWasAnimating = false

    sectionEl.value?.style.removeProperty("--lifeline-intro-progress")
    markerEls.forEach((marker) => {
      if (marker) marker.style.opacity = ""
    })
    updateFades()
    options.onIntroSettleComplete?.()
  }

  // --------------------------------------------------------------- mount

  let cleanup: (() => void) | undefined
  let introObserver: IntersectionObserver | undefined

  onMounted(() => {
    const section = sectionEl.value
    if (!section) return

    // A timeline short enough to fit its stage measures max = 0. It still
    // has to be shown — gating readiness on a scrollable track left any
    // small timeline permanently `invisible`.
    const max = measureLayout()

    if (!initialized) {
      // A skipped intro parks the rail where the intro would have settled
      // it — its end, the present. Embedded is no different: it is the same
      // intro and the same resting place.
      translatePx = introSkipped() ? max : 0
      initialized = true
    }

    applyTranslate(translatePx)
    isLayoutReady.value = true

    let frameId = 0
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    const onMotionChange = () => {
      prefersReducedMotion = motionQuery.matches
    }
    prefersReducedMotion = motionQuery.matches
    motionQuery.addEventListener("change", onMotionChange)

    const measure = () => {
      // max === 0 is a legitimate measurement — a timeline that fits — so
      // it must not skip the ready flag either.
      measureLayout()

      // The anchor's own loop owns translate while columns are resizing.
      // Clamping here as well fought it every frame: the observer pulled
      // the rail in against a max that was still shrinking, the anchor
      // shoved it back, and the reader saw a jolt of a few hundred pixels
      // mid-collapse. Refresh the bounds and leave the position alone.
      if (anchorId) {
        isLayoutReady.value = true
        return
      }

      translatePx = clamp(translatePx, 0, maxTranslate)

      // During intro scroll, the rAF loop owns translate — only refresh bounds.
      if (!(introAnimating() && introStarted)) applyTranslate(translatePx)

      isLayoutReady.value = true
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
    if (trackEl.value) resizeObserver.observe(trackEl.value)
    window.addEventListener("resize", scheduleMeasure)

    const scrub = (movement: number, target: number) => {
      applyTranslate(target)

      const impulse = (movement / WHEEL_VELOCITY_FRAME_MS) * 0.35
      dragVelocity =
        dragVelocity * (1 - WHEEL_MOMENTUM_BLEND) +
        impulse * WHEEL_MOMENTUM_BLEND

      // Embedded under reduced motion, skip the coast: inertia is what the
      // preference asks you to drop, and it is also the one thing that
      // makes the release decision non-deterministic.
      if (isEmbedNow && prefersReducedMotion) return

      if (momentumId === 0) startMomentum()
    }

    const release = () => {
      gestureReleased = true
      stopMomentum()
      dragVelocity = 0
    }

    /**
     * Segments the wheel stream into gestures, before the section's own
     * handler sees the event — a capture listener on the window runs ahead
     * of the target. The section alone cannot tell a gesture that started
     * on it from a page-scroll gesture that merely arrived on it, because
     * it only sees events once it is under the pointer.
     */
    const onWheelStream = (event: WheelEvent) => {
      const now = performance.now()
      wheelGapMs = now - wheelStreamAt
      wheelStreamAt = now

      if (wheelGapMs <= WHEEL_GESTURE_QUIET_MS) return

      gestureStartedHere =
        event.target instanceof Node && section.contains(event.target)
      gestureReleased = false
      boundaryHitAt = 0
    }

    const onWheel = (event: WheelEvent) => {
      if (isScrollLocked()) return

      if (maxTranslate <= 0) {
        scheduleMeasure()
        return
      }

      // A sideways swipe is never a request to scroll the page, so it
      // scrubs at the rail ends too and never releases.
      const horizontalIntent = Math.abs(event.deltaX) > Math.abs(event.deltaY)

      const delta = normalizeWheelDelta(event)
      /**
       * The two axes are not the same gesture and do not share a sign.
       *
       * Vertical is page scrolling: the intro leaves the rail at the
       * present, and scrolling down walks back through it — the same in
       * both modes. Embedding changes where the wheel *goes* at the ends of
       * the rail, not which way the rail travels.
       *
       * Horizontal is a drag by another name, so it has to match the
       * pointer drag below: the rail follows the fingers. Swiping left
       * (deltaX > 0) carries the timeline left, into the future, exactly as
       * grabbing it and pulling left does.
       */
      const movement = (horizontalIntent ? delta : -delta) * WHEEL_SPEED

      if (!resolveMode()) {
        // Page mode: the lifeline is the page and every wheel is ours.
        event.preventDefault()
        scrub(movement, translatePx + movement)
        return
      }

      if (!horizontalIntent) {
        // A gesture already in flight when it reached us belongs to the
        // page: the flick carries past, and the next scroll scrubs.
        if (!gestureStartedHere) return
        if (gestureReleased) return
      }

      const target = clamp(translatePx + movement, 0, maxTranslate)

      if (target === translatePx && !horizontalIntent) {
        // At an end of the rail, still being pushed further out. Hold the
        // wheel until the stream goes quiet, then hand it to the page.
        const now = performance.now()
        if (boundaryHitAt === 0) boundaryHitAt = now

        if (
          wheelGapMs < EMBED_BOUNDARY_QUIET_MS &&
          now - boundaryHitAt < EMBED_BOUNDARY_MAX_HOLD_MS
        ) {
          event.preventDefault()
          stopMomentum()
          dragVelocity = 0
          return
        }

        release()
        return
      }

      // Moving again — a reversal re-arms the hold at the other end.
      boundaryHitAt = 0
      event.preventDefault()
      scrub(movement, target)
    }

    // The rail moves by transform; any native scroll on the section is the
    // browser chasing a focused link deep in the track, and would leave the
    // transform and the layout disagreeing about where the rail is.
    const onSectionScroll = () => {
      if (section.scrollLeft !== 0) section.scrollLeft = 0
      if (section.scrollTop !== 0) section.scrollTop = 0
    }

    const beginDrag = (event: PointerEvent) => {
      stopMomentum()
      dragVelocity = 0
      dragging = true
      activePointerId = event.pointerId
      dragOrigin = { x: event.clientX, translate: translatePx }
      lastPointerSample = { x: event.clientX, t: performance.now() }

      section.setPointerCapture?.(event.pointerId)
      section.style.cursor = "grabbing"
      section.style.touchAction = "none"
    }

    const onPointerDown = (event: PointerEvent) => {
      if (isScrollLocked()) return
      if (isInteractiveTarget(event.target)) return
      if (maxTranslate <= 0) return
      if (activePointerId !== null) return

      gestureAxis = null
      gestureStart = { x: event.clientX, y: event.clientY }

      if (event.pointerType === "touch") {
        activePointerId = event.pointerId
        return
      }

      beginDrag(event)
    }

    const onPointerMove = (event: PointerEvent) => {
      if (activePointerId !== null && event.pointerId !== activePointerId) return

      if (!dragging && event.pointerType === "touch") {
        const deltaX = event.clientX - gestureStart.x
        const deltaY = event.clientY - gestureStart.y

        if (gestureAxis === null) {
          if (
            Math.abs(deltaX) < TOUCH_GESTURE_LOCK_PX &&
            Math.abs(deltaY) < TOUCH_GESTURE_LOCK_PX
          ) {
            return
          }

          gestureAxis = Math.abs(deltaX) >= Math.abs(deltaY) ? "x" : "y"

          if (gestureAxis === "y") {
            activePointerId = null
            return
          }

          beginDrag(event)
        }
      }

      if (!dragging) return

      if (event.pointerType === "touch") event.preventDefault()

      const now = performance.now()
      const sample = lastPointerSample
      const elapsed = now - sample.t
      const dragSpeed =
        event.pointerType === "touch" ? TOUCH_DRAG_SPEED : DRAG_SPEED

      if (elapsed > 0 && elapsed < 80) {
        const instantVelocity =
          (-(event.clientX - sample.x) / elapsed) * dragSpeed
        dragVelocity = instantVelocity * 0.65 + dragVelocity * 0.35
      }

      lastPointerSample = { x: event.clientX, t: now }

      const deltaX = event.clientX - dragOrigin.x
      applyTranslate(dragOrigin.translate - deltaX * dragSpeed)
    }

    const endDrag = (event: PointerEvent) => {
      if (activePointerId !== null && event.pointerId !== activePointerId) return

      const wasDragging = dragging

      dragging = false
      gestureAxis = null
      activePointerId = null

      if (section.hasPointerCapture(event.pointerId)) {
        section.releasePointerCapture(event.pointerId)
      }

      section.style.cursor = ""
      section.style.touchAction = ""

      if (wasDragging) startMomentum()
    }

    // Arrow keys scrub only when the lifeline effectively is the page, or
    // when focus is inside it. An embedded instance must not capture host
    // keyboard scrolling until the reader has tabbed into it.
    const ownsKeyboard = () => {
      const active = document.activeElement
      if (active && section.contains(active)) return true

      return !resolveMode()
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (maxTranslate <= 0) return
      if (isScrollLocked()) return
      if (isEditableTarget(event.target)) return
      if (!ownsKeyboard()) return

      stopMomentum()
      dragVelocity = 0

      if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
        event.preventDefault()
        applyTranslate(translatePx - maxTranslate * 0.05)
      }

      if (event.key === "ArrowRight" || event.key === "ArrowDown") {
        event.preventDefault()
        applyTranslate(translatePx + maxTranslate * 0.05)
      }
    }

    window.addEventListener("wheel", onWheelStream, {
      passive: true,
      capture: true,
    })
    section.addEventListener("scroll", onSectionScroll, { passive: true })
    section.addEventListener("wheel", onWheel, { passive: false })
    section.addEventListener("pointerdown", onPointerDown)
    section.addEventListener("pointermove", onPointerMove, { passive: false })
    section.addEventListener("pointerup", endDrag)
    section.addEventListener("pointercancel", endDrag)
    window.addEventListener("keydown", onKeyDown)

    cleanup = () => {
      cancelAnimationFrame(frameId)
      stopMomentum()
      settling = false
      resizeObserver.disconnect()
      motionQuery.removeEventListener("change", onMotionChange)
      window.removeEventListener("resize", scheduleMeasure)
      window.removeEventListener("wheel", onWheelStream, { capture: true })
      section.removeEventListener("scroll", onSectionScroll)
      section.removeEventListener("wheel", onWheel)
      section.removeEventListener("pointerdown", onPointerDown)
      section.removeEventListener("pointermove", onPointerMove)
      section.removeEventListener("pointerup", endDrag)
      section.removeEventListener("pointercancel", endDrag)
      window.removeEventListener("keydown", onKeyDown)
      dragging = false
      gestureAxis = null
      activePointerId = null
      // A remount must not start out believing it is mid-release.
      gestureStartedHere = false
      gestureReleased = false
      boundaryHitAt = 0
      wheelGapMs = Number.POSITIVE_INFINITY
      initialized = false
      section.style.cursor = ""
      section.style.touchAction = ""
    }

    runIntro()
  })

  /**
   * A full-page lifeline opens as the page opens, so its intro needs no
   * cue. An embedded one can be anywhere, including far below the fold —
   * playing there would spend the sweep on nobody. So it waits until the
   * module is about to come into view.
   */
  watch(
    [isEmbed, introArmed],
    () => {
      introObserver?.disconnect()
      introObserver = undefined

      if (!isEmbed.value || introArmed.value) return
      const section = sectionEl.value
      if (!section) return

      introObserver = new IntersectionObserver(
        (entries) => {
          if (!entries.some((entry) => entry.isIntersecting)) return
          introArmed.value = true
          introObserver?.disconnect()
        },
        { rootMargin: EMBED_INTRO_ARM_MARGIN },
      )

      introObserver.observe(section)
    },
    { flush: "post" },
  )

  watch(
    [
      isLayoutReady,
      isEmbed,
      introArmed,
      () => introAnimating(),
      () => introSkipped(),
    ],
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
    cancelAnimationFrame(anchorId)
    introObserver?.disconnect()
    cleanup?.()
  })

  return {
    sectionEl,
    trackEl,
    labelsEl,
    setMarkerRef,
    isLayoutReady,
    isEmbed,
    /**
     * Call after something changes every column's width at once — the
     * track filter is the only such thing today. Holds the reader's place
     * for the length of the width transition.
     */
    holdAnchorThroughResize,
    /**
     * Embedded only: whether the module has come into view and the intro is
     * cleared to play. Page mode never waits, so this stays false there and
     * callers should read it as `!isEmbed || introArmed`.
     */
    introArmed,
  }
}
