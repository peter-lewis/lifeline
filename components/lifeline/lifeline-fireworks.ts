import { inject, type InjectionKey } from "vue"
import type { LifelineEventEffect } from "./types"

export interface LifelineFireworksApi {
  launch: (effect: LifelineEventEffect) => void
}

export const LIFELINE_FIREWORKS: InjectionKey<LifelineFireworksApi> = Symbol(
  "lifeline-fireworks",
)

export function useLifelineFireworks() {
  return inject(LIFELINE_FIREWORKS, null)
}

export type Palette = [number[], number[], number[]]

export const PALETTES: Record<LifelineEventEffect, Palette> = {
  // Old Glory red / white / blue
  fireworks: [
    [0.9, 0.15, 0.25],
    [1.0, 1.0, 1.0],
    [0.25, 0.45, 0.95],
  ],
  // celeste / white / pale celeste
  "fireworks-argentina": [
    [0.45, 0.75, 0.98],
    [1.0, 1.0, 1.0],
    [0.7, 0.87, 1.0],
  ],
}

export const VERTEX_SHADER = `
attribute vec2 a_pos;
void main() {
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`

/**
 * Additive point-glow fireworks, composited over a night-sky scrim via
 * premultiplied canvas alpha.
 */
export const FRAGMENT_SHADER = `
precision highp float;

uniform vec2 u_res;
uniform float u_time;
uniform float u_dur;
uniform vec3 u_c0;
uniform vec3 u_c1;
uniform vec3 u_c2;

#define TAU 6.28318530718
#define N_FIREWORKS 10
#define N_PARTICLES 42

float hash(float n) {
  return fract(sin(n) * 43758.5453123);
}

vec3 palette(float m) {
  if (m < 0.5) return u_c0;
  if (m < 1.5) return u_c1;
  return u_c2;
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * u_res) / u_res.y;
  float t = u_time;
  float env = smoothstep(0.0, 0.5, t) * (1.0 - smoothstep(u_dur - 1.0, u_dur, t));

  vec3 col = vec3(0.0);

  for (int i = 0; i < N_FIREWORKS; i++) {
    float fi = float(i);
    float t0 = 0.35 + fi * (u_dur - 2.8) / float(N_FIREWORKS) + hash(fi * 7.31) * 0.3;
    // No flow control in the loop — some WebGL1 driver translations
    // mishandle continue, so inactive bursts multiply to zero instead.
    float active = step(t0, t) * step(t, t0 + 1.8);
    float lt = clamp((t - t0) / 1.8, 0.0, 1.0);

    vec2 center = vec2((hash(fi * 3.7) - 0.5) * 1.6, -0.05 + hash(fi * 9.1) * 0.5);
    vec3 base = palette(mod(fi, 3.0)); // strict red / white / blue rotation
    // Ramp in fast so overlapping particles at ignition don't stack
    // into a blown-out ball, then decay.
    float fade = exp(-lt * 4.0) * min(1.0, lt * 6.0);

    for (int j = 0; j < N_PARTICLES; j++) {
      float fj = float(j);
      float angle = (fj / float(N_PARTICLES)) * TAU + hash(fi * 100.0 + fj) * 0.15;
      float speed = 0.16 + 0.22 * hash(fj * 7.77 + fi * 31.3);

      vec2 p = center + vec2(cos(angle), sin(angle)) * speed * sqrt(lt);
      p.y -= 0.09 * lt * lt; // gravity

      float d = max(length(uv - p), 0.004);
      float sparkle = 0.7 + 0.3 * sin(30.0 * lt + fj * 1.7);
      col += base * active * fade * sparkle * 0.0006 / (d * d);
    }
  }

  col = clamp(col * env, 0.0, 1.0);
  float spark = max(col.r, max(col.g, col.b));
  float scrim = 0.45 * env;
  gl_FragColor = vec4(col, max(spark, scrim));
}
`
