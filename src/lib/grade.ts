/** Color-grade looks for the player. Cheap on purpose: CSS filter on the video + one blended tint layer + a vignette (no per-frame JS, no shader). */
export interface Grade {
  name: string
  /** swatch shown in the picker */
  sw: string
  /** brightness / contrast / saturate multipliers, hue-rotate degrees, sepia amount at full strength */
  b: number
  c: number
  s: number
  h?: number
  sp?: number
  /** colour wash laid over the picture with a blend mode (soft-light keeps the letterbox bars black) */
  tint?: string
  ta?: number
  /** edge darkening, 0-1 */
  vig: number
}

export const GRADES: Grade[] = [
  { name: 'Off', sw: 'linear-gradient(135deg,#555,#999)', b: 1, c: 1, s: 1, vig: 0 },
  // crisp, slightly richer, nothing tinted
  { name: 'Clean', sw: 'linear-gradient(135deg,#dfe9f5,#8fc1ff)', b: 1.02, c: 1.07, s: 1.12, vig: 0 },
  // dense saturation + lifted S-curve, cold sky / warm light (Your Name / Suzume feel)
  { name: 'Vivid', sw: 'linear-gradient(180deg,#3b6bff,#ff8a3d)', b: 1.03, c: 1.12, s: 1.32, tint: 'linear-gradient(180deg,#3b6bff 0%,#808080 50%,#ff8a3d 100%)', ta: 0.45, vig: 0.25 },
  // teal shadows, orange highlights
  { name: 'Teal & Orange', sw: 'linear-gradient(135deg,#00a8b5,#ff7a2f)', b: 1, c: 1.12, s: 1.18, tint: 'linear-gradient(135deg,#00a8b5 0%,#808080 50%,#ff7a2f 100%)', ta: 0.5, vig: 0.2 },
  // soft, warm, painterly
  { name: 'Ghibli', sw: 'linear-gradient(135deg,#ffd9a0,#8fcf8a)', b: 1.05, c: 0.97, s: 1.12, h: -4, sp: 0.1, tint: '#ffc27a', ta: 0.3, vig: 0.12 },
  // faded pastel, dreamy
  { name: 'Aesthetic', sw: 'linear-gradient(135deg,#ff9ad5,#9a8cff)', b: 1.07, c: 0.94, s: 1.1, h: -6, tint: 'linear-gradient(160deg,#ff9ad5 0%,#9a8cff 100%)', ta: 0.45, vig: 0.18 },
  // dark, cool, punchy
  { name: 'Night', sw: 'linear-gradient(135deg,#0b1a40,#3a5fcf)', b: 0.95, c: 1.16, s: 1.05, h: 6, tint: '#2a4fb0', ta: 0.35, vig: 0.4 },
  // 90s cel: warm, a bit faded, heavy vignette
  { name: 'Retro', sw: 'linear-gradient(135deg,#ffb870,#b5603a)', b: 1.02, c: 1.06, s: 1.05, h: -8, sp: 0.2, tint: '#ff9c4a', ta: 0.3, vig: 0.35 },
]

const L = (v: number, t: number) => +(1 + (v - 1) * t).toFixed(3)

/** CSS filter string for a grade at strength t (0-1) */
export const gradeFilter = (g: Grade, t: number) =>
  `brightness(${L(g.b, t)}) contrast(${L(g.c, t)}) saturate(${L(g.s, t)})${g.h ? ` hue-rotate(${+(g.h * t).toFixed(1)}deg)` : ''}${g.sp ? ` sepia(${+(g.sp * t).toFixed(3)})` : ''}`
