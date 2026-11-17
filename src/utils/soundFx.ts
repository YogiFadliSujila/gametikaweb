let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (Ctor) {
      audioCtx = new Ctor();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

function playTone(
  freq: number,
  duration: number,
  type: OscillatorType = 'triangle',
  volume = 0.08,
  delay = 0
): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  } catch {
    // Ignore audio errors when autoplay/audio hardware is unavailable
  }
}

export function playSelectTone(): void {
  playTone(523.25, 0.08, 'sine', 0.06);
}

export function playConnectTone(): void {
  playTone(587.33, 0.09, 'triangle', 0.07, 0);
  playTone(783.99, 0.11, 'triangle', 0.07, 0.06);
}

export function playDisconnectTone(): void {
  playTone(440, 0.08, 'sine', 0.05, 0);
  playTone(329.63, 0.09, 'sine', 0.05, 0.05);
}

export function playErrorTone(): void {
  playTone(246.94, 0.12, 'sawtooth', 0.05, 0);
  playTone(196.0, 0.16, 'sawtooth', 0.05, 0.09);
}

export function playSuccessChime(): void {
  playTone(523.25, 0.12, 'triangle', 0.08, 0);
  playTone(659.25, 0.12, 'triangle', 0.08, 0.09);
  playTone(783.99, 0.14, 'triangle', 0.08, 0.18);
  playTone(1046.5, 0.24, 'triangle', 0.09, 0.27);
}

export function playPaperPickupTone(): void {
  playTone(659.25, 0.08, 'triangle', 0.07, 0);
  playTone(880.0, 0.13, 'triangle', 0.07, 0.06);
}

export function playNpcTalkTone(): void {
  playTone(440.0, 0.07, 'sine', 0.055, 0);
  playTone(554.37, 0.09, 'sine', 0.055, 0.05);
}

export function playQuestStartTone(): void {
  playTone(493.88, 0.1, 'triangle', 0.07, 0);
  playTone(587.33, 0.1, 'triangle', 0.07, 0.08);
  playTone(739.99, 0.16, 'triangle', 0.075, 0.16);
}

