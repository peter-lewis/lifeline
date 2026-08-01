<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue"
import {
  FRAGMENT_SHADER,
  VERTEX_SHADER,
  type Palette,
} from "./lifeline-fireworks"

/** Tweak these */
const DURATION_S = 7.5
const MAX_DPR = 1.5

const props = defineProps<{ palette: Palette }>()
const emit = defineEmits<{ done: [] }>()

const canvasEl = ref<HTMLCanvasElement | null>(null)
let frame = 0
let onResize: (() => void) | undefined

onMounted(() => {
  const canvas = canvasEl.value
  if (!canvas) return

  const gl = canvas.getContext("webgl", {
    alpha: true,
    premultipliedAlpha: true,
    antialias: false,
  })
  if (!gl) {
    emit("done")
    return
  }

  const compile = (type: number, source: string) => {
    const shader = gl.createShader(type)!
    gl.shaderSource(shader, source)
    gl.compileShader(shader)
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.warn("fireworks shader:", gl.getShaderInfoLog(shader))
    }
    return shader
  }

  const program = gl.createProgram()!
  gl.attachShader(program, compile(gl.VERTEX_SHADER, VERTEX_SHADER))
  gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAGMENT_SHADER))
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.warn("fireworks link:", gl.getProgramInfoLog(program))
    emit("done")
    return
  }
  gl.useProgram(program)

  const buffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 3, -1, -1, 3]),
    gl.STATIC_DRAW,
  )
  const aPos = gl.getAttribLocation(program, "a_pos")
  gl.enableVertexAttribArray(aPos)
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

  const uRes = gl.getUniformLocation(program, "u_res")
  const uTime = gl.getUniformLocation(program, "u_time")
  const uDur = gl.getUniformLocation(program, "u_dur")

  const setColor = (name: string, rgb: number[]) => {
    gl.uniform3f(
      gl.getUniformLocation(program, name),
      rgb[0] ?? 0,
      rgb[1] ?? 0,
      rgb[2] ?? 0,
    )
  }
  const [c0, c1, c2] = props.palette
  setColor("u_c0", c0)
  setColor("u_c1", c1)
  setColor("u_c2", c2)

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR)
    canvas.width = Math.round(window.innerWidth * dpr)
    canvas.height = Math.round(window.innerHeight * dpr)
    gl.viewport(0, 0, canvas.width, canvas.height)
  }
  resize()
  onResize = resize
  window.addEventListener("resize", resize)

  const start = performance.now()

  const step = (now: number) => {
    const t = (now - start) / 1000
    if (t >= DURATION_S) {
      emit("done")
      return
    }

    gl.uniform2f(uRes, canvas.width, canvas.height)
    gl.uniform1f(uTime, t)
    gl.uniform1f(uDur, DURATION_S)
    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.drawArrays(gl.TRIANGLES, 0, 3)

    frame = requestAnimationFrame(step)
  }
  frame = requestAnimationFrame(step)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(frame)
  if (onResize) window.removeEventListener("resize", onResize)
})
</script>

<template>
  <canvas
    ref="canvasEl"
    aria-hidden="true"
    class="pointer-events-none fixed inset-0 z-[70] h-full w-full"
  />
</template>
