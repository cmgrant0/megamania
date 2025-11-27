import { Entity } from './Entity';
import { Bullet } from './Bullet';
import { CONFIG } from '../game/Config';
import { InputState } from '../systems/InputManager';

export class Player extends Entity {
  private velocityX: number = 0;
  private lastFireTime: number = 0;
  private fireRate: number = CONFIG.PLAYER.FIRE_RATE;
  public invincibleTime: number = 0;
  public hasShield: boolean = false;
  public rapidFire: boolean = false;
  private thrusterFrame: number = 0;
  private thrusterTimer: number = 0;

  constructor() {
    super(
      CONFIG.GAME_WIDTH / 2 - CONFIG.PLAYER.WIDTH / 2,
      CONFIG.GAME_HEIGHT - CONFIG.PLAYER.Y_OFFSET - CONFIG.PLAYER.HEIGHT,
      CONFIG.PLAYER.WIDTH,
      CONFIG.PLAYER.HEIGHT
    );
  }

  reset(): void {
    this.x = CONFIG.GAME_WIDTH / 2 - CONFIG.PLAYER.WIDTH / 2;
    this.velocityX = 0;
    this.invincibleTime = CONFIG.PLAYER.INVINCIBLE_TIME;
    this.active = true;
  }

  update(deltaTime: number): void {
    // Update invincibility
    if (this.invincibleTime > 0) {
      this.invincibleTime -= deltaTime * 1000;
    }

    // Update thruster animation
    this.thrusterTimer += deltaTime * 1000;
    if (this.thrusterTimer > 100) {
      this.thrusterTimer = 0;
      this.thrusterFrame = (this.thrusterFrame + 1) % 3;
    }

    // Apply friction
    this.velocityX *= Math.pow(1 - CONFIG.PLAYER.FRICTION * deltaTime, 1);

    // Update position
    this.x += this.velocityX * deltaTime;

    // Clamp to screen bounds
    if (this.x < 0) {
      this.x = 0;
      this.velocityX = 0;
    }
    if (this.x + this.width > CONFIG.GAME_WIDTH) {
      this.x = CONFIG.GAME_WIDTH - this.width;
      this.velocityX = 0;
    }
  }

  handleInput(input: InputState, deltaTime: number): void {
    if (input.left) {
      this.velocityX -= CONFIG.PLAYER.ACCELERATION * deltaTime;
    }
    if (input.right) {
      this.velocityX += CONFIG.PLAYER.ACCELERATION * deltaTime;
    }

    // Clamp velocity
    const maxSpeed = CONFIG.PLAYER.SPEED;
    if (this.velocityX > maxSpeed) this.velocityX = maxSpeed;
    if (this.velocityX < -maxSpeed) this.velocityX = -maxSpeed;
  }

  canFire(currentBullets: number): boolean {
    const now = performance.now();
    const rate = this.rapidFire ? CONFIG.POWERUP.RAPID_FIRE_RATE : this.fireRate;
    return currentBullets < CONFIG.PLAYER.MAX_BULLETS && now - this.lastFireTime >= rate;
  }

  fire(): Bullet {
    this.lastFireTime = performance.now();
    return new Bullet(this.centerX, this.y);
  }

  get isInvincible(): boolean {
    return this.invincibleTime > 0;
  }

  render(ctx: CanvasRenderingContext2D): void {
    // Flash when invincible
    if (this.isInvincible && Math.floor(this.invincibleTime / 100) % 2 === 0) {
      ctx.globalAlpha = 0.3;
    }

    // Draw ship body (Star Trek inspired design)
    ctx.fillStyle = CONFIG.COLORS.PLAYER;

    // Main hull (saucer section)
    ctx.beginPath();
    ctx.ellipse(this.centerX, this.y + 8, 16, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Engineering section
    ctx.fillRect(this.centerX - 4, this.y + 8, 8, 12);

    // Nacelles (engine pods)
    ctx.fillStyle = CONFIG.COLORS.PLAYER_ACCENT;
    ctx.fillRect(this.x + 2, this.y + 6, 6, 14);
    ctx.fillRect(this.x + this.width - 8, this.y + 6, 6, 14);

    // Thruster flames
    const flameHeight = 4 + this.thrusterFrame * 2;
    ctx.fillStyle = '#FF6600';
    ctx.fillRect(this.x + 3, this.y + this.height - 2, 4, flameHeight);
    ctx.fillRect(this.x + this.width - 7, this.y + this.height - 2, 4, flameHeight);
    ctx.fillStyle = '#FFFF00';
    ctx.fillRect(this.x + 4, this.y + this.height - 2, 2, flameHeight - 2);
    ctx.fillRect(this.x + this.width - 6, this.y + this.height - 2, 2, flameHeight - 2);

    // Shield effect
    if (this.hasShield) {
      ctx.strokeStyle = '#00FFFF';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(this.centerX, this.centerY, this.width / 2 + 6, this.height / 2 + 6, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.lineWidth = 1;
    }

    ctx.globalAlpha = 1;
  }
}
