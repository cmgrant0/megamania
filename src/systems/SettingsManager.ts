export type Difficulty = 'easy' | 'normal' | 'hard';
export type ParticleLevel = 'off' | 'low' | 'high';

export interface GameSettings {
  soundVolume: number; // 0-1
  soundMuted: boolean;
  difficulty: Difficulty;
  particleLevel: ParticleLevel;
  startingLives: number; // 3-6
}

const STORAGE_KEY = 'megamania_settings';

const DEFAULT_SETTINGS: GameSettings = {
  soundVolume: 0.3,
  soundMuted: false,
  difficulty: 'normal',
  particleLevel: 'high',
  startingLives: 3,
};

// Difficulty modifiers for enemy speed and fire rate
export const DIFFICULTY_MODIFIERS: Record<Difficulty, { speedMult: number; fireRateMult: number }> = {
  easy: { speedMult: 0.7, fireRateMult: 1.5 }, // Slower enemies, shoot less often
  normal: { speedMult: 1.0, fireRateMult: 1.0 },
  hard: { speedMult: 1.3, fireRateMult: 0.7 }, // Faster enemies, shoot more often
};

// Particle count multipliers
export const PARTICLE_MULTIPLIERS: Record<ParticleLevel, number> = {
  off: 0,
  low: 0.5,
  high: 1.0,
};

export class SettingsManager {
  private settings: GameSettings;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.settings = this.load();
  }

  private load(): GameSettings {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Merge with defaults to handle new settings added in updates
        return { ...DEFAULT_SETTINGS, ...parsed };
      }
    } catch {
      // Ignore errors, use defaults
    }
    return { ...DEFAULT_SETTINGS };
  }

  private save(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
    } catch {
      // Ignore storage errors
    }
    this.notifyListeners();
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener());
  }

  onChange(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Getters
  get soundVolume(): number {
    return this.settings.soundVolume;
  }

  get soundMuted(): boolean {
    return this.settings.soundMuted;
  }

  get effectiveVolume(): number {
    return this.settings.soundMuted ? 0 : this.settings.soundVolume;
  }

  get difficulty(): Difficulty {
    return this.settings.difficulty;
  }

  get difficultyModifier(): { speedMult: number; fireRateMult: number } {
    return DIFFICULTY_MODIFIERS[this.settings.difficulty];
  }

  get particleLevel(): ParticleLevel {
    return this.settings.particleLevel;
  }

  get particleMultiplier(): number {
    return PARTICLE_MULTIPLIERS[this.settings.particleLevel];
  }

  get startingLives(): number {
    return this.settings.startingLives;
  }

  // Setters
  setSoundVolume(volume: number): void {
    this.settings.soundVolume = Math.max(0, Math.min(1, volume));
    this.save();
  }

  setSoundMuted(muted: boolean): void {
    this.settings.soundMuted = muted;
    this.save();
  }

  setDifficulty(difficulty: Difficulty): void {
    this.settings.difficulty = difficulty;
    this.save();
  }

  setParticleLevel(level: ParticleLevel): void {
    this.settings.particleLevel = level;
    this.save();
  }

  setStartingLives(lives: number): void {
    this.settings.startingLives = Math.max(3, Math.min(6, lives));
    this.save();
  }

  // Reset high score (stored separately)
  resetHighScore(): void {
    try {
      localStorage.removeItem('megamania_highscore');
    } catch {
      // Ignore errors
    }
  }

  // Reset all settings to defaults
  resetToDefaults(): void {
    this.settings = { ...DEFAULT_SETTINGS };
    this.save();
  }
}

// Global singleton instance
export const settings = new SettingsManager();
