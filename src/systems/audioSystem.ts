type OscillatorWave = OscillatorType;

type ToneStep = {
  frequency: number;
  durationMs: number;
  type?: OscillatorWave;
  volume?: number;
};

class GeneratedAudioSystem {
  private audioContext?: AudioContext;
  private soundEnabled = true;
  private musicEnabled = true;
  private hasUserInteracted = false;
  private lastCoinTickAt = 0;

  setSoundEnabled(isEnabled: boolean): void {
    this.soundEnabled = isEnabled;
  }

  setMusicEnabled(isEnabled: boolean): void {
    this.musicEnabled = isEnabled;
  }

  resume(): void {
    this.hasUserInteracted = true;
    void this.ensureAudioContext();
  }

  playButtonClick(): void {
    this.playToneSequence([
      {
        frequency: 520,
        durationMs: 45,
        type: 'sine',
        volume: 0.035,
      },
    ]);
  }

  playHatch(): void {
    this.playToneSequence([
      {
        frequency: 540,
        durationMs: 70,
        type: 'triangle',
        volume: 0.045,
      },
      {
        frequency: 820,
        durationMs: 95,
        type: 'triangle',
        volume: 0.04,
      },
    ]);
  }

  playMerge(): void {
    this.playToneSequence([
      {
        frequency: 420,
        durationMs: 70,
        type: 'sine',
        volume: 0.045,
      },
      {
        frequency: 630,
        durationMs: 80,
        type: 'triangle',
        volume: 0.045,
      },
      {
        frequency: 840,
        durationMs: 95,
        type: 'triangle',
        volume: 0.04,
      },
    ]);
  }

  playCoinTick(): void {
    const now = Date.now();

    if (now - this.lastCoinTickAt < 250) {
      return;
    }

    this.lastCoinTickAt = now;
    this.playToneSequence([
      {
        frequency: 980,
        durationMs: 40,
        type: 'square',
        volume: 0.025,
      },
      {
        frequency: 1320,
        durationMs: 55,
        type: 'sine',
        volume: 0.026,
      },
    ]);
  }

  private playToneSequence(steps: ToneStep[]): void {
    if (!this.soundEnabled || !this.hasUserInteracted || steps.length === 0) {
      return;
    }

    void this.playToneSequenceAsync(steps);
  }

  private async playToneSequenceAsync(steps: ToneStep[]): Promise<void> {
    try {
      const audioContext = await this.ensureAudioContext();

      if (!audioContext) {
        return;
      }

      let startTime = audioContext.currentTime;

      steps.forEach((step) => {
        this.playTone(audioContext, step, startTime);
        startTime += step.durationMs / 1000;
      });
    } catch {
      // Audio is non-critical and may be blocked by browser policy.
    }
  }

  private async ensureAudioContext(): Promise<AudioContext | undefined> {
    if (this.audioContext) {
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      return this.audioContext;
    }

    const AudioContextConstructor = window.AudioContext
      ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

    if (!AudioContextConstructor) {
      return undefined;
    }

    this.audioContext = new AudioContextConstructor();

    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    return this.audioContext;
  }

  private playTone(audioContext: AudioContext, step: ToneStep, startTime: number): void {
    const durationSeconds = Math.max(0.02, step.durationMs / 1000);
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const volume = step.volume ?? 0.035;

    oscillator.type = step.type ?? 'sine';
    oscillator.frequency.setValueAtTime(step.frequency, startTime);
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.exponentialRampToValueAtTime(volume, startTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + durationSeconds);

    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start(startTime);
    oscillator.stop(startTime + durationSeconds + 0.01);

    oscillator.onended = () => {
      oscillator.disconnect();
      gain.disconnect();
    };
  }
}

export const audioSystem = new GeneratedAudioSystem();
