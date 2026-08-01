<script setup lang="ts">
import { onBeforeUnmount, ref } from "vue"
import { Check, Copy } from "@lucide/vue"
import { cn } from "@/components/lifeline/cn"

const props = defineProps<{ command: string }>()

const copied = ref(false)
let timeout: ReturnType<typeof setTimeout> | null = null

onBeforeUnmount(() => {
  if (timeout) clearTimeout(timeout)
})

async function copy() {
  try {
    await navigator.clipboard.writeText(props.command)
    copied.value = true
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch {
    // Clipboard unavailable (e.g. insecure context) — leave the text selectable.
  }
}
</script>

<template>
  <button
    type="button"
    :aria-label="copied ? 'Copied' : `Copy ${props.command}`"
    class="group relative hidden items-center text-sm md:flex"
    @click="copy"
  >
    <span
      :class="
        cn(
          'truncate transition duration-300 ease-out',
          copied
            ? '-translate-x-[22px] text-black dark:text-white'
            : 'text-zinc-500 group-hover:-translate-x-[22px] group-hover:text-black dark:group-hover:text-white',
        )
      "
    >
      {{ props.command }}
    </span>
    <span class="absolute right-0 top-1/2 h-3.5 w-3.5 -translate-y-1/2">
      <Check
        :stroke-width="1.75"
        :class="
          cn(
            'absolute inset-0 h-3.5 w-3.5 text-zinc-500 transition-opacity duration-300',
            copied ? 'opacity-100' : 'opacity-0',
          )
        "
      />
      <Copy
        :stroke-width="1.75"
        :class="
          cn(
            'absolute inset-0 h-3.5 w-3.5 text-zinc-500 transition-opacity duration-300 group-hover:text-black dark:group-hover:text-white',
            copied ? 'opacity-0' : 'opacity-0 group-hover:opacity-100',
          )
        "
      />
    </span>
  </button>
</template>
