/// <reference types="@webgpu/types" />

/** WebGPU is needed for the Anime4K upscaler. */
export const gpuSupported = typeof navigator !== 'undefined' && 'gpu' in navigator

// Zero-copy: the decoder frame is sampled as an external texture straight into the CNN input (no CPU readback).
const WGSL = /* wgsl */ `
struct V { @builtin(position) p: vec4f, @location(0) uv: vec2f }
@vertex fn vs(@builtin(vertex_index) i: u32) -> V {
  var pos = array<vec2f, 3>(vec2f(-1, -1), vec2f(3, -1), vec2f(-1, 3));
  var o: V;
  o.p = vec4f(pos[i], 0, 1);
  o.uv = vec2f((pos[i].x + 1) * 0.5, (1 - pos[i].y) * 0.5);
  return o;
}
@group(0) @binding(0) var s: sampler;
@group(0) @binding(1) var t: texture_2d<f32>;
@fragment fn fs(v: V) -> @location(0) vec4f { return textureSample(t, s, v.uv); }
@group(0) @binding(1) var ext: texture_external;
@fragment fn fsExt(v: V) -> @location(0) vec4f { return textureSampleBaseClampToEdge(ext, s, v.uv); }`

/**
 * Anime4K on the GPU: video -> canvas. Sources <=720p get Mode A (restore + CNN x2 VL); bigger ones get the
 * ~4x cheaper CNN x2 M. Canvas is sized to the screen (max 2x source), never blindly 4K.
 * If the GPU can't keep up (>30% dropped frames) onSlow() fires so the caller can switch it off.
 * Resolves to a stop() function.
 */
export async function startUpscale(video: HTMLVideoElement, canvas: HTMLCanvasElement, onSlow?: () => void): Promise<() => void> {
  if (!gpuSupported) throw new Error('WebGPU is not available in this browser')
  if (!video.videoWidth) await new Promise((r) => video.addEventListener('loadedmetadata', r, { once: true }))
  const w = video.videoWidth
  const h = video.videoHeight
  if (h >= 1440 || w >= 2560) throw new Error('Source is already high resolution')

  const adapter = await navigator.gpu.requestAdapter({ powerPreference: 'high-performance' })
  if (!adapter) throw new Error('No GPU adapter found')
  const device = await adapter.requestDevice()
  const { ModeA, CNNx2M } = await import('anime4k-webgpu')

  // ponytail: sized from the screen, not the element, so fullscreen needs no resize handling
  const dpr = window.devicePixelRatio || 1
  const k = Math.max(1, Math.min(2, (screen.width * dpr) / w, (screen.height * dpr) / h))
  canvas.width = Math.round(w * k)
  canvas.height = Math.round(h * k)
  const ctx = canvas.getContext('webgpu')
  if (!ctx) throw new Error('Could not open a WebGPU canvas')
  const format = navigator.gpu.getPreferredCanvasFormat()
  ctx.configure({ device, format, alphaMode: 'opaque' })

  const input = device.createTexture({
    size: [w, h],
    format: 'rgba16float',
    usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.RENDER_ATTACHMENT,
  })
  const preset =
    w * h <= 1280 * 720
      ? new ModeA({ device, inputTexture: input, nativeDimensions: { width: w, height: h }, targetDimensions: { width: canvas.width, height: canvas.height } })
      : new CNNx2M({ device, inputTexture: input })
  const module = device.createShaderModule({ code: WGSL })
  const mk = (fs: string, f: GPUTextureFormat) =>
    device.createRenderPipeline({ layout: 'auto', vertex: { module, entryPoint: 'vs' }, fragment: { module, entryPoint: fs, targets: [{ format: f }] }, primitive: { topology: 'triangle-list' } })
  const load = mk('fsExt', 'rgba16float')
  const pipe = mk('fs', format)
  const sampler = device.createSampler({ magFilter: 'linear', minFilter: 'linear' })
  const bind = device.createBindGroup({
    layout: pipe.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: sampler },
      { binding: 1, resource: preset.getOutputTexture().createView() },
    ],
  })
  const inView = input.createView()

  let alive = true
  let cb = 0
  let pending = 0
  let frames = 0
  let dropped = 0
  const draw = () => {
    if (!alive || video.readyState < 2) return
    if (++frames > 120) {
      if (dropped / frames > 0.3) return void (alive = false, onSlow?.())
      frames = dropped = 0
    }
    if (pending > 1) return void dropped++ // GPU still busy: skip this frame instead of queueing it (this is what froze the page)
    const enc = device.createCommandEncoder()
    const up = enc.beginRenderPass({ colorAttachments: [{ view: inView, loadOp: 'clear', storeOp: 'store' }] })
    up.setPipeline(load)
    up.setBindGroup(0, device.createBindGroup({ layout: load.getBindGroupLayout(0), entries: [{ binding: 0, resource: sampler }, { binding: 1, resource: device.importExternalTexture({ source: video }) }] }))
    up.draw(3)
    up.end()
    preset.pass(enc)
    const rp = enc.beginRenderPass({ colorAttachments: [{ view: ctx.getCurrentTexture().createView(), loadOp: 'clear', storeOp: 'store' }] })
    rp.setPipeline(pipe)
    rp.setBindGroup(0, bind)
    rp.draw(3)
    rp.end()
    device.queue.submit([enc.finish()])
    pending++
    void device.queue.onSubmittedWorkDone().then(() => pending--)
  }
  // Redraws on every presented frame (also after seeks while paused); rAF is the fallback.
  const loop = () => {
    draw()
    if (alive) cb = video.requestVideoFrameCallback ? video.requestVideoFrameCallback(loop) : requestAnimationFrame(loop)
  }
  loop()

  return () => {
    alive = false
    if (video.cancelVideoFrameCallback) video.cancelVideoFrameCallback(cb)
    else cancelAnimationFrame(cb)
    device.destroy()
  }
}
