import { Entity } from './Entity';
import { CONFIG } from '../game/Config';

export enum PowerUpType {
  RAPID_FIRE = 'RAPID_FIRE',
  SHIELD = 'SHIELD',
  ENERGY_BOOST = 'ENERGY_BOOST',
  SCORE_MULTIPLIER = 'SCORE_MULTIPLIER',
}

const POWERUP_COLORS: Record<PowerUpType, string> = {
  [PowerUpType.RAPID_FIRE]: '#FF6600',
  [PowerUpType.SHIELD]: '#00FFFF',
  [PowerUpType.ENERGY_BOOST]: '#00FF00',
  [PowerUpType.SCORE_MULTIPLIER]: '#FFFF00',
};

const POWERUP_SYMBOLS: Record<PowerUpType, string> = {
  [PowerUpType.RAPID_FIRE]: 'R',
  [PowerUpType.SHIELD]: 'S',
  [PowerUpType.ENERGY_BOOST]: 'E',
  [PowerUpType.SCORE_MULTIPLIER]: 'x2',
};

export class PowerUp extends Entity {
  readonly type: PowerUpType;
  private bobOffset: number = 0;
  private bobTime: number = 0;

  constructor(x: number, y: number, type?: PowerUpType) {
    super(
      x - CONFIG.POWERUP.WIDTH / 2,
      y,
      CONFIG.POWERUP.WIDTH,
      CONFIG.POWERUP.HEIGHT
    );

    // Random type if not specified
    if (type) {
      this.type = type;
    } else {
      const types = Object.values(PowerUpType);
      this.type = types[Math.floor(Math.random() * types.length)];
    }
  }

  update(deltaTime: number): void {
    // Fall down
    this.y += CONFIG.POWERUP.FALL_SPEED * deltaTime;

    // Bob animation
    this.bobTime += deltaTime * 5;
    this.bobOffset = Math.sin(this.bobTime) * 3;

    // Deactivate if off screen
    if (this.y > CONFIG.GAME_HEIGHT) {
      this.active = false;
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    const color = POWERUP_COLORS[this.type];
    const symbol = POWERUP_SYMBOLS[this.type];

    ctx.save();
    ctx.translate(this.centerX, this.centerY + this.bobOffset);

    // Outer glow
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;

    // Background circle
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.beginPath();
    ctx.arc(0, 0, 11, 0, Math.PI * 2);
    ctx.fill();

    // Border
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI * 2);
    ctx.stroke();

    // Symbol
    ctx.fillStyle = color;
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(symbol, 0, 1);

    ctx.shadowBlur = 0;
    ctx.restore();
  }

  static shouldDrop(): boolean {
    return Math.random() < CONFIG.POWERUP.DROP_CHANCE;
  }
}
