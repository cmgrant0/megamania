import { Entity } from './Entity';
import { CONFIG, EnemyType } from '../game/Config';
import { EnemyBullet } from './Bullet';

export interface EnemyConfig {
  type: EnemyType;
  points: number;
  speed: number;
  fireRate: number;
  megaCycle: number;
}

export abstract class Enemy extends Entity {
  readonly type: EnemyType;
  readonly points: number;
  protected speed: number;
  protected baseSpeed: number;
  protected fireRate: number;
  protected lastFireTime: number = 0;
  protected megaCycle: number;
  protected animFrame: number = 0;
  protected animTimer: number = 0;
  protected initialX: number;
  protected initialY: number;
  protected time: number = 0;

  constructor(x: number, y: number, width: number, height: number, config: EnemyConfig) {
    super(x, y, width, height);
    this.type = config.type;
    this.points = config.megaCycle > 1 ? 90 : config.points;
    this.baseSpeed = config.speed;
    this.speed = config.speed * (1 + (config.megaCycle - 1) * 0.08);
    this.fireRate = config.fireRate * Math.pow(0.95, config.megaCycle - 1);
    this.megaCycle = config.megaCycle;
    this.initialX = x;
    this.initialY = y;
  }

  update(deltaTime: number): void {
    this.time += deltaTime;

    // Update animation
    this.animTimer += deltaTime * 1000;
    if (this.animTimer > 150) {
      this.animTimer = 0;
      this.animFrame = (this.animFrame + 1) % 4;
    }

    // Wrap around at bottom
    if (this.y > CONFIG.GAME_HEIGHT + this.height) {
      this.y = -this.height;
    }

    // Keep in horizontal bounds
    if (this.x < 0) this.x = 0;
    if (this.x + this.width > CONFIG.GAME_WIDTH) this.x = CONFIG.GAME_WIDTH - this.width;
  }

  canFire(): boolean {
    const now = performance.now();
    return now - this.lastFireTime >= this.fireRate;
  }

  fire(playerX: number): EnemyBullet | null {
    if (!this.canFire()) return null;
    this.lastFireTime = performance.now();

    // Aim towards player with some randomness
    const dx = playerX - this.centerX;
    const velocityX = (dx / CONFIG.GAME_HEIGHT) * CONFIG.ENEMY_BULLET.SPEED * 0.3;

    return new EnemyBullet(this.centerX, this.bottom, velocityX);
  }

  abstract getMovementPattern(): { dx: number; dy: number };
}

// Wave 1: Hamburgers - Horizontal sweep
export class Hamburger extends Enemy {
  private direction: number = 1;
  private pauseTimer: number = 0;
  private isPaused: boolean = false;

  constructor(x: number, y: number, config: Omit<EnemyConfig, 'type' | 'points' | 'speed' | 'fireRate'>) {
    super(x, y, 28, 20, {
      ...config,
      type: 'HAMBURGER',
      ...CONFIG.ENEMIES.HAMBURGER,
    });
    this.direction = x < CONFIG.GAME_WIDTH / 2 ? 1 : -1;
  }

  getMovementPattern(): { dx: number; dy: number } {
    // In later megacycles, pause then accelerate
    if (this.megaCycle > 1 && !this.isPaused && Math.random() < 0.002) {
      this.isPaused = true;
      this.pauseTimer = 300;
    }

    if (this.isPaused) {
      this.pauseTimer -= 16;
      if (this.pauseTimer <= 0) {
        this.isPaused = false;
      }
      return { dx: 0, dy: 0 };
    }

    return { dx: this.speed * this.direction, dy: 0 };
  }

  update(deltaTime: number): void {
    const movement = this.getMovementPattern();
    this.x += movement.dx * deltaTime;
    this.y += movement.dy * deltaTime;

    // Bounce off walls
    if (this.x <= 0 || this.x + this.width >= CONFIG.GAME_WIDTH) {
      this.direction *= -1;
      this.y += 20;
    }

    super.update(deltaTime);
  }

  render(ctx: CanvasRenderingContext2D): void {
    // Top bun
    ctx.fillStyle = '#D4A24C';
    ctx.beginPath();
    ctx.ellipse(this.centerX, this.y + 5, 14, 5, 0, Math.PI, 0);
    ctx.fill();

    // Sesame seeds
    ctx.fillStyle = '#FFFFCC';
    ctx.fillRect(this.centerX - 6, this.y + 2, 3, 2);
    ctx.fillRect(this.centerX + 3, this.y + 2, 3, 2);

    // Lettuce
    ctx.fillStyle = '#44CC44';
    ctx.fillRect(this.x + 2, this.y + 7, this.width - 4, 3);

    // Patty
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(this.x + 3, this.y + 10, this.width - 6, 5);

    // Bottom bun
    ctx.fillStyle = '#D4A24C';
    ctx.beginPath();
    ctx.ellipse(this.centerX, this.y + 17, 14, 4, 0, 0, Math.PI);
    ctx.fill();
  }
}

// Wave 2: Cookies - Weave and descend
export class Cookie extends Enemy {
  private waveOffset: number;
  private diveBombing: boolean = false;

  constructor(x: number, y: number, config: Omit<EnemyConfig, 'type' | 'points' | 'speed' | 'fireRate'>, waveOffset: number = 0) {
    super(x, y, 24, 24, {
      ...config,
      type: 'COOKIE',
      ...CONFIG.ENEMIES.COOKIE,
    });
    this.waveOffset = waveOffset;
  }

  getMovementPattern(): { dx: number; dy: number } {
    // Dive bomb in later megacycles
    if (this.megaCycle > 1 && !this.diveBombing && Math.random() < 0.003) {
      this.diveBombing = true;
    }

    if (this.diveBombing) {
      return { dx: 0, dy: this.speed * 3 };
    }

    const dx = Math.sin(this.time * 3 + this.waveOffset) * this.speed;
    const dy = this.speed * 0.3;
    return { dx, dy };
  }

  update(deltaTime: number): void {
    const movement = this.getMovementPattern();
    this.x += movement.dx * deltaTime;
    this.y += movement.dy * deltaTime;
    super.update(deltaTime);
  }

  render(ctx: CanvasRenderingContext2D): void {
    // Cookie base
    ctx.fillStyle = '#D2691E';
    ctx.beginPath();
    ctx.arc(this.centerX, this.centerY, 11, 0, Math.PI * 2);
    ctx.fill();

    // Chocolate chips
    ctx.fillStyle = '#4A2C2A';
    const chipPositions = [
      [-4, -4], [3, -2], [-2, 4], [5, 3], [-5, 1]
    ];
    chipPositions.forEach(([ox, oy]) => {
      ctx.beginPath();
      ctx.arc(this.centerX + ox, this.centerY + oy, 2, 0, Math.PI * 2);
      ctx.fill();
    });
  }
}

// Wave 3: Bugs - Horizontal with slow descent and undulation
export class Bug extends Enemy {
  private direction: number = 1;
  private waveOffset: number;

  constructor(x: number, y: number, config: Omit<EnemyConfig, 'type' | 'points' | 'speed' | 'fireRate'>, waveOffset: number = 0) {
    super(x, y, 24, 16, {
      ...config,
      type: 'BUG',
      ...CONFIG.ENEMIES.BUG,
    });
    this.direction = x < CONFIG.GAME_WIDTH / 2 ? 1 : -1;
    this.waveOffset = waveOffset;
  }

  getMovementPattern(): { dx: number; dy: number } {
    const undulation = this.megaCycle > 1 ? Math.sin(this.time * 4 + this.waveOffset) * 30 : 0;
    return {
      dx: this.speed * this.direction + undulation,
      dy: this.speed * 0.15,
    };
  }

  update(deltaTime: number): void {
    const movement = this.getMovementPattern();
    this.x += movement.dx * deltaTime;
    this.y += movement.dy * deltaTime;

    if (this.x <= 0 || this.x + this.width >= CONFIG.GAME_WIDTH) {
      this.direction *= -1;
    }

    super.update(deltaTime);
  }

  render(ctx: CanvasRenderingContext2D): void {
    // Body
    ctx.fillStyle = '#228B22';
    ctx.beginPath();
    ctx.ellipse(this.centerX, this.centerY, 10, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Head
    ctx.fillStyle = '#1B5E20';
    ctx.beginPath();
    ctx.arc(this.centerX + 8, this.centerY, 4, 0, Math.PI * 2);
    ctx.fill();

    // Legs (animated)
    ctx.strokeStyle = '#228B22';
    ctx.lineWidth = 2;
    const legOffset = Math.sin(this.animFrame * Math.PI / 2) * 3;
    for (let i = 0; i < 3; i++) {
      const lx = this.centerX - 6 + i * 6;
      ctx.beginPath();
      ctx.moveTo(lx, this.centerY + 4);
      ctx.lineTo(lx - 3, this.centerY + 8 + (i % 2 === 0 ? legOffset : -legOffset));
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(lx, this.centerY - 4);
      ctx.lineTo(lx - 3, this.centerY - 8 + (i % 2 === 0 ? -legOffset : legOffset));
      ctx.stroke();
    }
    ctx.lineWidth = 1;

    // Antennae
    ctx.strokeStyle = '#1B5E20';
    ctx.beginPath();
    ctx.moveTo(this.centerX + 10, this.centerY - 2);
    ctx.lineTo(this.centerX + 14, this.centerY - 6);
    ctx.moveTo(this.centerX + 10, this.centerY + 2);
    ctx.lineTo(this.centerX + 14, this.centerY + 6);
    ctx.stroke();
  }
}

// Wave 4: Radial Tires - Fast weaving descent
export class RadialTire extends Enemy {
  private waveOffset: number;
  private rowDirection: number;

  constructor(x: number, y: number, config: Omit<EnemyConfig, 'type' | 'points' | 'speed' | 'fireRate'>, waveOffset: number = 0, row: number = 0) {
    super(x, y, 26, 26, {
      ...config,
      type: 'RADIAL_TIRE',
      ...CONFIG.ENEMIES.RADIAL_TIRE,
    });
    this.waveOffset = waveOffset;
    this.rowDirection = row % 2 === 0 ? 1 : -1;
  }

  getMovementPattern(): { dx: number; dy: number } {
    const dx = Math.sin(this.time * 4 + this.waveOffset) * this.speed * this.rowDirection;
    const dy = this.speed * 0.8;
    return { dx, dy };
  }

  update(deltaTime: number): void {
    const movement = this.getMovementPattern();
    this.x += movement.dx * deltaTime;
    this.y += movement.dy * deltaTime;
    super.update(deltaTime);
  }

  render(ctx: CanvasRenderingContext2D): void {
    const rotation = this.time * 5;

    ctx.save();
    ctx.translate(this.centerX, this.centerY);
    ctx.rotate(rotation);

    // Outer tire
    ctx.fillStyle = '#1A1A1A';
    ctx.beginPath();
    ctx.arc(0, 0, 12, 0, Math.PI * 2);
    ctx.fill();

    // Tread pattern
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 2;
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * 8, Math.sin(angle) * 8);
      ctx.lineTo(Math.cos(angle) * 12, Math.sin(angle) * 12);
      ctx.stroke();
    }

    // Hub
    ctx.fillStyle = '#888888';
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI * 2);
    ctx.fill();

    // Hub detail
    ctx.fillStyle = '#AAAAAA';
    ctx.beginPath();
    ctx.arc(0, 0, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

// Wave 5: Diamonds - Small, spin, fire frequently
export class Diamond extends Enemy {
  private direction: number = 1;
  private waveOffset: number;

  constructor(x: number, y: number, config: Omit<EnemyConfig, 'type' | 'points' | 'speed' | 'fireRate'>, waveOffset: number = 0) {
    super(x, y, 18, 22, {
      ...config,
      type: 'DIAMOND',
      ...CONFIG.ENEMIES.DIAMOND,
    });
    this.direction = x < CONFIG.GAME_WIDTH / 2 ? 1 : -1;
    this.waveOffset = waveOffset;
  }

  getMovementPattern(): { dx: number; dy: number } {
    const undulation = Math.sin(this.time * 5 + this.waveOffset) * 40;
    return {
      dx: this.speed * this.direction + undulation,
      dy: this.speed * 0.2,
    };
  }

  update(deltaTime: number): void {
    const movement = this.getMovementPattern();
    this.x += movement.dx * deltaTime;
    this.y += movement.dy * deltaTime;

    if (this.x <= 0 || this.x + this.width >= CONFIG.GAME_WIDTH) {
      this.direction *= -1;
    }

    super.update(deltaTime);
  }

  render(ctx: CanvasRenderingContext2D): void {
    const wink = Math.sin(this.time * 8) * 0.3 + 0.7;

    ctx.save();
    ctx.translate(this.centerX, this.centerY);
    ctx.scale(wink, 1);

    // Diamond shape
    ctx.fillStyle = '#00DDFF';
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(8, 0);
    ctx.lineTo(0, 10);
    ctx.lineTo(-8, 0);
    ctx.closePath();
    ctx.fill();

    // Shine
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(3, -2);
    ctx.lineTo(0, 2);
    ctx.lineTo(-3, -2);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }
}

// Wave 6: Steam Irons - Three columns, sweep side to side
export class SteamIron extends Enemy {
  private columnIndex: number;
  private targetX: number;

  constructor(x: number, y: number, config: Omit<EnemyConfig, 'type' | 'points' | 'speed' | 'fireRate'>, columnIndex: number = 0) {
    super(x, y, 28, 20, {
      ...config,
      type: 'STEAM_IRON',
      ...CONFIG.ENEMIES.STEAM_IRON,
    });
    this.columnIndex = columnIndex;
    this.targetX = x;
  }

  getMovementPattern(): { dx: number; dy: number } {
    // Move towards target X
    const dx = (this.targetX - this.x) * 3;
    const dy = this.speed * 0.5;
    return { dx, dy };
  }

  update(deltaTime: number): void {
    // Randomly change column position
    if (Math.random() < 0.01) {
      const columns = [80, CONFIG.GAME_WIDTH / 2, CONFIG.GAME_WIDTH - 80];
      const newColumn = (this.columnIndex + Math.floor(Math.random() * 2) + 1) % 3;
      this.targetX = columns[newColumn] - this.width / 2;
      this.columnIndex = newColumn;
    }

    const movement = this.getMovementPattern();
    this.x += movement.dx * deltaTime;
    this.y += movement.dy * deltaTime;
    super.update(deltaTime);
  }

  render(ctx: CanvasRenderingContext2D): void {
    // Iron body
    ctx.fillStyle = '#708090';
    ctx.beginPath();
    ctx.moveTo(this.x, this.y + 16);
    ctx.lineTo(this.x + 4, this.y);
    ctx.lineTo(this.x + this.width - 4, this.y);
    ctx.lineTo(this.x + this.width, this.y + 16);
    ctx.closePath();
    ctx.fill();

    // Handle
    ctx.fillStyle = '#2F4F4F';
    ctx.fillRect(this.x + 8, this.y - 4, this.width - 16, 6);

    // Steam holes
    ctx.fillStyle = '#333333';
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.arc(this.x + 6 + i * 4, this.y + 14, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Steam effect (animated)
    if (this.animFrame % 2 === 0) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(this.x + 8 + i * 6, this.y + 18 + Math.random() * 4, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

// Wave 7: Bow Ties - Up/down and horizontal, heavy fire when low
export class BowTie extends Enemy {
  private direction: number = 1;
  private verticalDirection: number = 1;

  constructor(x: number, y: number, config: Omit<EnemyConfig, 'type' | 'points' | 'speed' | 'fireRate'>) {
    super(x, y, 30, 16, {
      ...config,
      type: 'BOW_TIE',
      ...CONFIG.ENEMIES.BOW_TIE,
    });
    this.direction = x < CONFIG.GAME_WIDTH / 2 ? 1 : -1;
  }

  getMovementPattern(): { dx: number; dy: number } {
    return {
      dx: this.speed * this.direction,
      dy: this.speed * 0.5 * this.verticalDirection,
    };
  }

  canFire(): boolean {
    // Fire more when lower on screen
    const lowMultiplier = this.y > CONFIG.GAME_HEIGHT / 2 ? 0.5 : 1;
    const now = performance.now();
    return now - this.lastFireTime >= this.fireRate * lowMultiplier;
  }

  update(deltaTime: number): void {
    const movement = this.getMovementPattern();
    this.x += movement.dx * deltaTime;
    this.y += movement.dy * deltaTime;

    // Bounce off walls
    if (this.x <= 0 || this.x + this.width >= CONFIG.GAME_WIDTH) {
      this.direction *= -1;
    }

    // Bounce vertically
    if (this.y <= 50 || this.y >= CONFIG.GAME_HEIGHT * 0.6) {
      this.verticalDirection *= -1;
    }

    super.update(deltaTime);
  }

  render(ctx: CanvasRenderingContext2D): void {
    const spin = Math.sin(this.time * 6) * 0.2;

    ctx.save();
    ctx.translate(this.centerX, this.centerY);
    ctx.rotate(spin);

    // Left triangle
    ctx.fillStyle = '#FF1493';
    ctx.beginPath();
    ctx.moveTo(-14, 0);
    ctx.lineTo(-2, -7);
    ctx.lineTo(-2, 7);
    ctx.closePath();
    ctx.fill();

    // Right triangle
    ctx.beginPath();
    ctx.moveTo(14, 0);
    ctx.lineTo(2, -7);
    ctx.lineTo(2, 7);
    ctx.closePath();
    ctx.fill();

    // Center knot
    ctx.fillStyle = '#C71585';
    ctx.fillRect(-3, -4, 6, 8);

    ctx.restore();
  }
}

// Wave 8: Space Dice - Falling patterns, 45° in later cycles
export class SpaceDice extends Enemy {
  private angle: number = Math.PI; // Straight down
  private faceValue: number;

  constructor(x: number, y: number, config: Omit<EnemyConfig, 'type' | 'points' | 'speed' | 'fireRate'>) {
    super(x, y, 24, 24, {
      ...config,
      type: 'SPACE_DICE',
      ...CONFIG.ENEMIES.SPACE_DICE,
    });
    this.faceValue = Math.floor(Math.random() * 6) + 1;

    // 45° diagonal angles in later megacycles (down-right or down-left)
    if (config.megaCycle > 1) {
      this.angle = Math.random() < 0.5 ? (3 * Math.PI) / 4 : (5 * Math.PI) / 4;
    }
  }

  getMovementPattern(): { dx: number; dy: number } {
    return {
      dx: Math.cos(this.angle - Math.PI / 2) * this.speed,
      dy: Math.sin(this.angle - Math.PI / 2) * this.speed,
    };
  }

  update(deltaTime: number): void {
    const movement = this.getMovementPattern();
    this.x += movement.dx * deltaTime;
    this.y += movement.dy * deltaTime;

    // Bounce off side walls (reverse horizontal direction)
    if (this.x <= 0 || this.x + this.width >= CONFIG.GAME_WIDTH) {
      this.angle = -this.angle;
    }

    super.update(deltaTime);
  }

  render(ctx: CanvasRenderingContext2D): void {
    const rotation = this.time * 2;

    ctx.save();
    ctx.translate(this.centerX, this.centerY);
    ctx.rotate(rotation);

    // Dice body
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(-10, -10, 20, 20);

    // Border
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.strokeRect(-10, -10, 20, 20);

    // Dots based on face value
    ctx.fillStyle = '#000000';
    const dotPositions: Record<number, [number, number][]> = {
      1: [[0, 0]],
      2: [[-4, -4], [4, 4]],
      3: [[-4, -4], [0, 0], [4, 4]],
      4: [[-4, -4], [4, -4], [-4, 4], [4, 4]],
      5: [[-4, -4], [4, -4], [0, 0], [-4, 4], [4, 4]],
      6: [[-4, -4], [4, -4], [-4, 0], [4, 0], [-4, 4], [4, 4]],
    };

    (dotPositions[this.faceValue] || []).forEach(([dx, dy]) => {
      ctx.beginPath();
      ctx.arc(dx, dy, 2, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();
  }
}
