import { CONFIG } from '../game/Config';

const HIGH_SCORE_KEY = 'megamania_highscore';

export class ScoreManager {
  private _score: number = 0;
  private _highScore: number = 0;
  private _multiplier: number = 1;
  private _multiplierEndTime: number = 0;
  private _lastExtraLifeScore: number = 0;

  constructor() {
    this.loadHighScore();
  }

  get score(): number {
    return this._score;
  }

  get highScore(): number {
    return this._highScore;
  }

  get multiplier(): number {
    return this._multiplier;
  }

  get hasMultiplier(): boolean {
    return this._multiplier > 1 && performance.now() < this._multiplierEndTime;
  }

  reset(): void {
    this._score = 0;
    this._multiplier = 1;
    this._multiplierEndTime = 0;
    this._lastExtraLifeScore = 0;
  }

  addScore(points: number): void {
    // Check multiplier
    if (performance.now() >= this._multiplierEndTime) {
      this._multiplier = 1;
    }

    const actualPoints = points * this._multiplier;
    this._score = Math.min(this._score + actualPoints, CONFIG.SCORING.MAX_SCORE);

    // Update high score
    if (this._score > this._highScore) {
      this._highScore = this._score;
      this.saveHighScore();
    }
  }

  addBonusPoints(wavePoints: number, remainingEnergy: number): void {
    const bonus = wavePoints * remainingEnergy;
    this.addScore(bonus);
  }

  checkExtraLife(): boolean {
    const threshold = CONFIG.PLAYER.EXTRA_LIFE_SCORE;
    const livesEarned = Math.floor(this._score / threshold);
    const previousLives = Math.floor(this._lastExtraLifeScore / threshold);

    if (livesEarned > previousLives) {
      this._lastExtraLifeScore = this._score;
      return true;
    }
    return false;
  }

  activateMultiplier(): void {
    this._multiplier = CONFIG.POWERUP.SCORE_MULTIPLIER;
    this._multiplierEndTime = performance.now() + CONFIG.POWERUP.SCORE_MULTIPLIER_DURATION;
  }

  isVictory(): boolean {
    return this._score >= CONFIG.SCORING.MAX_SCORE;
  }

  isNewHighScore(): boolean {
    return this._score === this._highScore && this._score > 0;
  }

  private loadHighScore(): void {
    try {
      const saved = localStorage.getItem(HIGH_SCORE_KEY);
      if (saved) {
        this._highScore = parseInt(saved, 10) || 0;
      }
    } catch {
      // localStorage not available
      this._highScore = 0;
    }
  }

  private saveHighScore(): void {
    try {
      localStorage.setItem(HIGH_SCORE_KEY, this._highScore.toString());
    } catch {
      // localStorage not available
    }
  }
}
