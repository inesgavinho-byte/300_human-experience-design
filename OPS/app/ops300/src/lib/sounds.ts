// Sound alerts for 300 OPS using Web Audio API
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

function isSoundEnabled(): boolean {
  const stored = localStorage.getItem('300-sound-enabled');
  return stored === null ? true : stored === 'true';
}

function playTone(
  frequency: number,
  duration: number,
  type: OscillatorType = 'sine',
  gain = 0.1
): void {
  if (document.visibilityState !== 'visible') return;
  if (!isSoundEnabled()) return;

  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);

    gainNode.gain.setValueAtTime(gain, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Silently fail if audio is not supported
  }
}

/** Urgent double beep for critical alerts */
export function playCriticalSound(): void {
  playTone(880, 0.15, 'square', 0.08);
  setTimeout(() => playTone(880, 0.15, 'square', 0.08), 200);
}

/** Single gentle beep for standard alerts */
export function playAlertSound(): void {
  playTone(660, 0.2, 'sine', 0.08);
}
