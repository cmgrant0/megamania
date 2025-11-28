import { CONFIG } from '../game/Config';
import { settings, Difficulty, ParticleLevel } from '../systems/SettingsManager';
import { AudioManager } from '../systems/AudioManager';
import { ScoreManager } from '../systems/ScoreManager';

interface Button {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  action: () => void;
}

interface Slider {
  x: number;
  y: number;
  width: number;
  height: number;
  value: () => number;
  onChange: (value: number) => void;
}

export class SettingsOverlay {
  private isOpen = false;
  private buttons: Button[] = [];
  private sliders: Slider[] = [];
  private audioManager: AudioManager | null = null;
  private scoreManager: ScoreManager | null = null;
  private confirmingReset = false;
  private activeSlider: Slider | null = null;

  // Canvas scale factor for click handling
  private scaleX = 1;
  private scaleY = 1;

  constructor() {
    this.buildUI();
  }

  setAudioManager(audio: AudioManager): void {
    this.audioManager = audio;
  }

  setScoreManager(score: ScoreManager): void {
    this.scoreManager = score;
  }

  private buildUI(): void {
    const centerX = CONFIG.GAME_WIDTH / 2;
    const startY = 140;
    const rowHeight = 50;
    const buttonWidth = 80;
    const buttonHeight = 30;

    // Row 1: Volume slider
    this.sliders.push({
      x: centerX - 80,
      y: startY,
      width: 160,
      height: 20,
      value: () => settings.soundVolume,
      onChange: (v) => {
        settings.setSoundVolume(v);
        if (this.audioManager) {
          this.audioManager.setVolume(settings.effectiveVolume);
        }
      },
    });

    // Row 2: Mute toggle
    const muteY = startY + rowHeight;
    this.buttons.push({
      x: centerX - 40,
      y: muteY,
      width: buttonWidth,
      height: buttonHeight,
      label: '',
      action: () => {
        settings.setSoundMuted(!settings.soundMuted);
        if (this.audioManager) {
          this.audioManager.setVolume(settings.effectiveVolume);
        }
      },
    });

    // Row 3: Difficulty
    const diffY = startY + rowHeight * 2;
    const difficulties: Difficulty[] = ['easy', 'normal', 'hard'];
    difficulties.forEach((diff, i) => {
      this.buttons.push({
        x: centerX - 120 + i * 85,
        y: diffY,
        width: 70,
        height: buttonHeight,
        label: diff.toUpperCase(),
        action: () => settings.setDifficulty(diff),
      });
    });

    // Row 4: Particles
    const particleY = startY + rowHeight * 3;
    const levels: ParticleLevel[] = ['off', 'low', 'high'];
    levels.forEach((level, i) => {
      this.buttons.push({
        x: centerX - 120 + i * 85,
        y: particleY,
        width: 70,
        height: buttonHeight,
        label: level.toUpperCase(),
        action: () => settings.setParticleLevel(level),
      });
    });

    // Row 5: Starting Lives
    const livesY = startY + rowHeight * 4;
    for (let lives = 3; lives <= 6; lives++) {
      this.buttons.push({
        x: centerX - 135 + (lives - 3) * 70,
        y: livesY,
        width: 55,
        height: buttonHeight,
        label: lives.toString(),
        action: () => settings.setStartingLives(lives),
      });
    }

    // Row 6: Reset High Score
    const resetY = startY + rowHeight * 5.5;
    this.buttons.push({
      x: centerX - 70,
      y: resetY,
      width: 140,
      height: buttonHeight,
      label: 'RESET SCORE',
      action: () => {
        if (this.confirmingReset) {
          settings.resetHighScore();
          if (this.scoreManager) {
            this.scoreManager.clearHighScore();
          }
          this.confirmingReset = false;
        } else {
          this.confirmingReset = true;
        }
      },
    });

    // Close button
    this.buttons.push({
      x: centerX - 50,
      y: startY + rowHeight * 7,
      width: 100,
      height: 36,
      label: 'CLOSE',
      action: () => this.close(),
    });
  }

  open(): void {
    this.isOpen = true;
    this.confirmingReset = false;
  }

  close(): void {
    this.isOpen = false;
    this.confirmingReset = false;
    this.activeSlider = null;
  }

  toggle(): void {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  get visible(): boolean {
    return this.isOpen;
  }

  updateScale(canvas: HTMLCanvasElement): void {
    const rect = canvas.getBoundingClientRect();
    this.scaleX = CONFIG.GAME_WIDTH / rect.width;
    this.scaleY = CONFIG.GAME_HEIGHT / rect.height;
  }

  handleClick(clientX: number, clientY: number, canvas: HTMLCanvasElement): boolean {
    if (!this.isOpen) return false;

    const rect = canvas.getBoundingClientRect();
    const x = (clientX - rect.left) * this.scaleX;
    const y = (clientY - rect.top) * this.scaleY;

    // Check sliders
    for (const slider of this.sliders) {
      if (
        x >= slider.x &&
        x <= slider.x + slider.width &&
        y >= slider.y - 10 &&
        y <= slider.y + slider.height + 10
      ) {
        const value = (x - slider.x) / slider.width;
        slider.onChange(Math.max(0, Math.min(1, value)));
        return true;
      }
    }

    // Check buttons
    for (const button of this.buttons) {
      if (
        x >= button.x &&
        x <= button.x + button.width &&
        y >= button.y &&
        y <= button.y + button.height
      ) {
        button.action();
        return true;
      }
    }

    return true; // Consume click even if nothing hit (overlay is open)
  }

  handleMouseDown(clientX: number, clientY: number, canvas: HTMLCanvasElement): boolean {
    if (!this.isOpen) return false;

    const rect = canvas.getBoundingClientRect();
    const x = (clientX - rect.left) * this.scaleX;
    const y = (clientY - rect.top) * this.scaleY;

    // Check if clicking on a slider
    for (const slider of this.sliders) {
      if (
        x >= slider.x &&
        x <= slider.x + slider.width &&
        y >= slider.y - 10 &&
        y <= slider.y + slider.height + 10
      ) {
        this.activeSlider = slider;
        const value = (x - slider.x) / slider.width;
        slider.onChange(Math.max(0, Math.min(1, value)));
        return true;
      }
    }

    return false;
  }

  handleMouseMove(clientX: number, _clientY: number, canvas: HTMLCanvasElement): void {
    if (!this.activeSlider) return;

    const rect = canvas.getBoundingClientRect();
    const x = (clientX - rect.left) * this.scaleX;
    const value = (x - this.activeSlider.x) / this.activeSlider.width;
    this.activeSlider.onChange(Math.max(0, Math.min(1, value)));
  }

  handleMouseUp(): void {
    this.activeSlider = null;
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (!this.isOpen) return;

    const centerX = CONFIG.GAME_WIDTH / 2;

    // Semi-transparent background
    ctx.fillStyle = 'rgba(0, 0, 20, 0.92)';
    ctx.fillRect(0, 0, CONFIG.GAME_WIDTH, CONFIG.GAME_HEIGHT);

    // Title
    ctx.fillStyle = '#FFFF00';
    ctx.font = 'bold 28px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('SETTINGS', centerX, 80);

    const startY = 140;
    const rowHeight = 50;

    // Volume label and slider
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '14px monospace';
    ctx.textAlign = 'right';
    ctx.fillText('VOLUME', centerX - 90, startY + 14);
    this.renderSlider(ctx, this.sliders[0]);

    // Volume percentage
    ctx.textAlign = 'left';
    ctx.fillText(`${Math.round(settings.soundVolume * 100)}%`, centerX + 90, startY + 14);

    // Mute row
    const muteY = startY + rowHeight;
    ctx.textAlign = 'right';
    ctx.fillText('SOUND', centerX - 50, muteY + 20);
    this.renderToggleButton(ctx, centerX - 40, muteY, 80, 30, settings.soundMuted ? 'OFF' : 'ON', !settings.soundMuted);

    // Difficulty row
    const diffY = startY + rowHeight * 2;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#AAAAAA';
    ctx.fillText('DIFFICULTY', centerX, diffY - 8);
    const difficulties: Difficulty[] = ['easy', 'normal', 'hard'];
    difficulties.forEach((diff, i) => {
      const x = centerX - 120 + i * 85;
      this.renderSelectButton(ctx, x, diffY, 70, 30, diff.toUpperCase(), settings.difficulty === diff);
    });

    // Particles row
    const particleY = startY + rowHeight * 3;
    ctx.fillStyle = '#AAAAAA';
    ctx.fillText('PARTICLES', centerX, particleY - 8);
    const levels: ParticleLevel[] = ['off', 'low', 'high'];
    levels.forEach((level, i) => {
      const x = centerX - 120 + i * 85;
      this.renderSelectButton(ctx, x, particleY, 70, 30, level.toUpperCase(), settings.particleLevel === level);
    });

    // Starting Lives row
    const livesY = startY + rowHeight * 4;
    ctx.fillStyle = '#AAAAAA';
    ctx.fillText('STARTING LIVES', centerX, livesY - 8);
    for (let lives = 3; lives <= 6; lives++) {
      const x = centerX - 135 + (lives - 3) * 70;
      this.renderSelectButton(ctx, x, livesY, 55, 30, lives.toString(), settings.startingLives === lives);
    }

    // Reset High Score
    const resetY = startY + rowHeight * 5.5;
    ctx.fillStyle = '#AAAAAA';
    ctx.fillText('HIGH SCORE', centerX, resetY - 8);
    if (this.confirmingReset) {
      this.renderDangerButton(ctx, centerX - 70, resetY, 140, 30, 'CONFIRM?');
    } else {
      this.renderButton(ctx, centerX - 70, resetY, 140, 30, 'RESET');
    }

    // Close button
    const closeY = startY + rowHeight * 7;
    this.renderButton(ctx, centerX - 50, closeY, 100, 36, 'CLOSE', true);

    // Footer hint
    ctx.fillStyle = '#666666';
    ctx.font = '11px monospace';
    ctx.fillText('Settings are saved automatically', centerX, CONFIG.GAME_HEIGHT - 30);
  }

  private renderSlider(ctx: CanvasRenderingContext2D, slider: Slider): void {
    const value = slider.value();

    // Track background
    ctx.fillStyle = '#333333';
    ctx.fillRect(slider.x, slider.y, slider.width, slider.height);

    // Track fill
    ctx.fillStyle = '#00AAFF';
    ctx.fillRect(slider.x, slider.y, slider.width * value, slider.height);

    // Border
    ctx.strokeStyle = '#666666';
    ctx.lineWidth = 1;
    ctx.strokeRect(slider.x, slider.y, slider.width, slider.height);

    // Handle
    const handleX = slider.x + slider.width * value;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(handleX - 4, slider.y - 3, 8, slider.height + 6);
  }

  private renderButton(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, label: string, highlight = false): void {
    ctx.fillStyle = highlight ? '#444466' : '#333344';
    ctx.fillRect(x, y, w, h);

    ctx.strokeStyle = highlight ? '#00AAFF' : '#555566';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(label, x + w / 2, y + h / 2 + 4);
  }

  private renderToggleButton(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, label: string, active: boolean): void {
    ctx.fillStyle = active ? '#005500' : '#550000';
    ctx.fillRect(x, y, w, h);

    ctx.strokeStyle = active ? '#00FF00' : '#FF0000';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);

    ctx.fillStyle = active ? '#00FF00' : '#FF4444';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(label, x + w / 2, y + h / 2 + 4);
  }

  private renderSelectButton(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, label: string, selected: boolean): void {
    ctx.fillStyle = selected ? '#003366' : '#222233';
    ctx.fillRect(x, y, w, h);

    ctx.strokeStyle = selected ? '#00AAFF' : '#444455';
    ctx.lineWidth = selected ? 2 : 1;
    ctx.strokeRect(x, y, w, h);

    ctx.fillStyle = selected ? '#00DDFF' : '#888888';
    ctx.font = selected ? 'bold 11px monospace' : '11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(label, x + w / 2, y + h / 2 + 4);
  }

  private renderDangerButton(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, label: string): void {
    // Pulsing effect
    const pulse = Math.sin(performance.now() / 150) * 0.3 + 0.7;
    ctx.fillStyle = `rgba(100, 0, 0, ${pulse})`;
    ctx.fillRect(x, y, w, h);

    ctx.strokeStyle = '#FF4444';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);

    ctx.fillStyle = '#FF6666';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(label, x + w / 2, y + h / 2 + 4);
  }
}
