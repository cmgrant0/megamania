import { Entity } from './Entity';
import { CONFIG } from '../game/Config';

export class Bullet extends Entity {
  private velocityY: number;

  constructor(x: number, y: number, velocityY: number = -CONFIG.BULLET.SPEED) {
    super(
      x - CONFIG.BULLET.WIDTH / 2,
      y,
      CONFIG.BULLET.WIDTH,
      CONFIG.BULLET.HEIGHT
    );
    this.velocityY = velocityY;
  }

  update(deltaTime: number): void {
    this.y += this.velocityY * deltaTime;

    // Deactivate if off screen
    if (this.y + this.height < 0 || this.y > CONFIG.GAME_HEIGHT) {
      this.active = false;
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = CONFIG.COLORS.BULLET;
    ctx.fillRect(this.x, this.y, this.width, this.height);

    // Add glow effect
    ctx.shadowColor = CONFIG.COLORS.BULLET;
    ctx.shadowBlur = 8;
    ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.shadowBlur = 0;
  }
}

export class EnemyBullet extends Entity {
  private velocityY: number;
  private velocityX: number;

  constructor(x: number, y: number, velocityX: number = 0) {
    super(
      x - CONFIG.ENEMY_BULLET.WIDTH / 2,
      y,
      CONFIG.ENEMY_BULLET.WIDTH,
      CONFIG.ENEMY_BULLET.HEIGHT
    );
    this.velocityY = CONFIG.ENEMY_BULLET.SPEED;
    this.velocityX = velocityX;
  }

  update(deltaTime: number): void {
    this.y += this.velocityY * deltaTime;
    this.x += this.velocityX * deltaTime;

    // Deactivate if off screen
    if (this.y > CONFIG.GAME_HEIGHT || this.x < 0 || this.x > CONFIG.GAME_WIDTH) {
      this.active = false;
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = CONFIG.COLORS.ENEMY_BULLET;
    ctx.fillRect(this.x, this.y, this.width, this.height);

    // Add glow effect
    ctx.shadowColor = CONFIG.COLORS.ENEMY_BULLET;
    ctx.shadowBlur = 6;
    ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.shadowBlur = 0;
  }
}
