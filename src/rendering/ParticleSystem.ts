interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export class ParticleSystem {
  private particles: Particle[] = [];

  createExplosion(x: number, y: number, color: string, count: number = 12): void {
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
      const speed = 100 + Math.random() * 150;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.4 + Math.random() * 0.2,
        maxLife: 0.4 + Math.random() * 0.2,
        color,
        size: 3 + Math.random() * 4,
      });
    }
  }

  createPlayerExplosion(x: number, y: number): void {
    // Multiple colors for player explosion
    const colors = ['#00AAFF', '#0066AA', '#FFFFFF', '#FFFF00'];
    colors.forEach((color) => {
      this.createExplosion(x, y, color, 8);
    });
  }

  createEnemyExplosion(x: number, y: number, color: string): void {
    this.createExplosion(x, y, color, 10);
    // Add white sparks
    this.createExplosion(x, y, '#FFFFFF', 5);
  }

  createPowerUpCollect(x: number, y: number, color: string): void {
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const speed = 80;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.3,
        maxLife: 0.3,
        color,
        size: 4,
      });
    }
  }

  update(deltaTime: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * deltaTime;
      p.y += p.vy * deltaTime;
      p.life -= deltaTime;

      // Apply gravity
      p.vy += 200 * deltaTime;

      // Slow down
      p.vx *= 0.98;
      p.vy *= 0.98;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    this.particles.forEach((p) => {
      const alpha = p.life / p.maxLife;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;

      // Size shrinks as particle dies
      const size = p.size * alpha;

      ctx.beginPath();
      ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  }

  clear(): void {
    this.particles = [];
  }
}
