export type SoundKind = "ui" | "ratchet" | "cock" | "dry" | "shot" | "pulse" | "win";

let audioContext: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === "undefined" || !("AudioContext" in window)) return null;
  audioContext ??= new window.AudioContext();
  if (audioContext.state === "suspended") void audioContext.resume().catch(() => undefined);
  return audioContext;
}

function tone(
  context: AudioContext,
  frequency: number,
  duration: number,
  volume: number,
  wave: OscillatorType = "sine",
  endFrequency = frequency,
) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = wave;
  oscillator.frequency.setValueAtTime(frequency, context.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(Math.max(25, endFrequency), context.currentTime + duration);
  gain.gain.setValueAtTime(0.0001, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, volume), context.currentTime + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + duration + 0.02);
}

function noise(context: AudioContext, duration: number, volume: number, cutoff: number, withReverb = false) {
  const length = Math.max(1, Math.floor(context.sampleRate * duration));
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const channel = buffer.getChannelData(0);
  const randomValues = new Uint32Array(length);
  for (let start = 0; start < length; start += 16_384) {
    globalThis.crypto.getRandomValues(randomValues.subarray(start, Math.min(length, start + 16_384)));
  }
  for (let index = 0; index < channel.length; index += 1) {
    const decay = 1 - index / channel.length;
    channel[index] = ((randomValues[index]! / 0xffff_ffff) * 2 - 1) * decay;
  }
  const source = context.createBufferSource();
  const filter = context.createBiquadFilter();
  const gain = context.createGain();
  filter.type = "lowpass";
  filter.frequency.value = cutoff;
  gain.gain.value = volume;
  source.buffer = buffer;
  source.connect(filter);
  filter.connect(gain);
  gain.connect(context.destination);
  let convolver: ConvolverNode | null = null;
  let wet: GainNode | null = null;
  if (withReverb) {
    const tailLength = Math.floor(context.sampleRate * 0.82);
    const tail = context.createBuffer(1, tailLength, context.sampleRate);
    const tailValues = new Uint32Array(tailLength);
    for (let start = 0; start < tailLength; start += 16_384) {
      globalThis.crypto.getRandomValues(tailValues.subarray(start, Math.min(tailLength, start + 16_384)));
    }
    const impulse = tail.getChannelData(0);
    for (let index = 0; index < tailLength; index += 1) {
      const fade = 1 - index / tailLength;
      impulse[index] = ((tailValues[index]! / 0xffff_ffff) * 2 - 1) * fade * fade;
    }
    convolver = context.createConvolver();
    wet = context.createGain();
    convolver.buffer = tail;
    wet.gain.value = 0.32;
    gain.connect(convolver);
    convolver.connect(wet);
    wet.connect(context.destination);
    window.setTimeout(() => {
      source.disconnect();
      filter.disconnect();
      gain.disconnect();
      convolver?.disconnect();
      wet?.disconnect();
    }, 1500);
  }
  source.start();
}

export function playSound(kind: SoundKind, volume = 0.65, enabled = true) {
  if (!enabled || volume <= 0) return;
  const context = getContext();
  if (!context) return;
  const level = Math.max(0, Math.min(1, volume));
  if (kind === "ui") {
    tone(context, 900, 0.045, 0.03 * level, "sine", 620);
  } else if (kind === "cock") {
    tone(context, 180, 0.22, 0.09 * level, "triangle", 78);
    noise(context, 0.07, 0.035 * level, 1500);
  } else if (kind === "ratchet") {
    for (let index = 0; index < 5; index += 1) {
      const start = context.currentTime + index * 0.085;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "square";
      oscillator.frequency.setValueAtTime(1300 - index * 150, start);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.026 * level, start + 0.006);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.035);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(start);
      oscillator.stop(start + 0.04);
    }
  } else if (kind === "dry") {
    tone(context, 940, 0.14, 0.13 * level, "triangle", 220);
    noise(context, 0.055, 0.1 * level, 2400);
  } else if (kind === "shot") {
    tone(context, 78, 0.42, 0.34 * level, "sawtooth", 32);
    tone(context, 116, 0.27, 0.15 * level, "sine", 42);
    noise(context, 0.3, 0.32 * level, 1150, true);
    tone(context, 4200, 0.72, 0.065 * level, "sine", 2700);
  } else if (kind === "pulse") {
    tone(context, 68, 0.15, 0.16 * level, "sine", 37);
    window.setTimeout(() => tone(context, 60, 0.18, 0.12 * level, "sine", 35), 190);
  } else {
    tone(context, 523.25, 0.4, 0.08 * level, "sine", 523.25);
    window.setTimeout(() => tone(context, 659.25, 0.42, 0.07 * level, "sine", 659.25), 120);
    window.setTimeout(() => tone(context, 783.99, 0.7, 0.075 * level, "sine", 783.99), 240);
  }
}

export function vibrate(pattern: number | number[], enabled = true) {
  if (!enabled || typeof navigator === "undefined" || !("vibrate" in navigator)) return;
  navigator.vibrate(pattern);
}
