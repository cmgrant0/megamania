import { CONFIG } from '../game/Config';

interface Star {
  x: number;
  y: number;
  size: number;
  speed: number;
  brightness: number;
}

export class Starfield {
  private stars: Star[] = [];
  private readonly numStars = 100;

  constructor() {
    this.initStars();
  }

  private initStars(): void {
    for (let i = 0; i < this.numStars; i++) {
      this.stars.push(this.createStar());
    }
  }

  private createStar(y?: number): Star {
    const depth = Math.random();
    return {
      x: Math.random() * CONFIG.GAME_WIDTH,
      y: y !== undefined ? y : Math.random() * CONFIG.GAME_HEIGHT,
      size: 0.5 + depth * 1.5,
      speed: 20 + depth * 40,
      brightness: 0.3 + depth * 0.7,
    };
  }

  update(deltaTime: number): void {
    this.stars.forEach((star) => {
      star.y += star.speed * deltaTime;
      if (star.y > CONFIG.GAME_HEIGHT) {
        Object.assign(star, this.createStar(0));
      }
    });
  }

  render(ctx: CanvasRenderingContext2D): void {
    this.stars.forEach((star) => {
      ctx.globalAlpha = star.brightness;
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  }
}
