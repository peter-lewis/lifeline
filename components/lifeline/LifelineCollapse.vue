<script setup lang="ts">
/**
 * Folds its contents in and out instead of letting `v-if` cut them.
 *
 * `0fr` -> `1fr` on a grid track is the only way to animate to an
 * intrinsic size — `height: auto` and `width: auto` will not transition —
 * so the child is measured normally and the track does the moving. The
 * inner wrapper clips, and carries `min-h-0` / `min-w-0` because a grid
 * item's default minimum is its content, which would refuse to shrink.
 *
 * Keep any margin that belongs to the content *inside* the slot. Left on
 * the outside it survives the fold and leaves a gap where the content was.
 */
const props = withDefaults(
  defineProps<{
    show: boolean
    /** `y` collapses height (the default); `x` collapses width. */
    axis?: "x" | "y"
    durationMs?: number
  }>(),
  { axis: "y", durationMs: 300 },
)
</script>

<template>
  <div
    class="grid ease-out"
    :style="{
      transitionProperty:
        props.axis === 'y'
          ? 'grid-template-rows, opacity'
          : 'grid-template-columns, opacity',
      transitionDuration: `${props.durationMs}ms`,
      ...(props.axis === 'y'
        ? { gridTemplateRows: props.show ? '1fr' : '0fr' }
        : { gridTemplateColumns: props.show ? '1fr' : '0fr' }),
      opacity: props.show ? 1 : 0,
    }"
    :aria-hidden="props.show ? undefined : 'true'"
  >
    <div :class="props.axis === 'y' ? 'min-h-0 overflow-hidden' : 'min-w-0 overflow-hidden'">
      <slot />
    </div>
  </div>
</template>
