import { CONFIG, WAVE_ORDER } from './Config';
import { GameState } from './GameState';
import { Player } from '../entities/Player';
import { Bullet, EnemyBullet } from '../entities/Bullet';
import { Enemy } from '../entities/Enemy';
import { PowerUp, PowerUpType } from '../entities/PowerUp';
import { InputManager } from '../systems/InputManager';
import { AudioManager } from '../systems/AudioManager';
import { ScoreManager } from '../systems/ScoreManager';
import { WaveManager } from '../waves/WaveManager';
import { ParticleSystem } from '../rendering/ParticleSystem';
import { Starfield } from '../rendering/Starfield';

export class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private input: InputManager;
  private audio: AudioManager;
  private score: ScoreManager;
  private waveManager: WaveManager;
  private particles: ParticleSystem;
  private starfield: Starfield;

  private state: GameState = GameState.TITLE;
  private player: Player;
  private bullets: Bullet[] = [];
  private enemyBullets: EnemyBullet[] = [];
  private powerUps: PowerUp[] = [];

  private lives: number = CONFIG.PLAYER.STARTING_LIVES;
  private energy: number = CONFIG.ENERGY.MAX;
  private energyWarningPlayed: boolean = false;

  private lastTime: number = 0;
  private transitionTimer: number = 0;
  private deathTimer: number = 0;

  // Power-up timers
  private rapidFireEndTime: number = 0;

  // Screen shake
  private shakeIntensity: number = 0;
  private shakeDecay: number = 0.9;

  constructor() {
    this.canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;

    this.input = new InputManager();
    this.audio = new AudioManager();
    this.score = new ScoreManager();
    this.waveManager = new WaveManager();
    this.particles = new ParticleSystem();
    this.starfield = new Starfield();
    this.player = new Player();

    this.setupCanvas();
    window.addEventListener('resize', () => this.setupCanvas());
  }

  private setupCanvas(): void {
    const maxWidth = window.innerWidth;
    const maxHeight = window.innerHeight;

    const scale = Math.min(
      maxWidth / CONFIG.GAME_WIDTH,
      maxHeight / CONFIG.GAME_HEIGHT
    );

    this.canvas.width = CONFIG.GAME_WIDTH;
    this.canvas.height = CONFIG.GAME_HEIGHT;
    this.canvas.style.width = `${CONFIG.GAME_WIDTH * scale}px`;
    this.canvas.style.height = `${CONFIG.GAME_HEIGHT * scale}px`;
  }

  start(): void {
    this.lastTime = performance.now();
    requestAnimationFrame((time) => this.gameLoop(time));
  }

  private gameLoop(currentTime: number): void {
    const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1);
    this.lastTime = currentTime;

    this.update(deltaTime);
    this.render();
    this.input.update();

    requestAnimationFrame((time) => this.gameLoop(time));
  }

  private update(deltaTime: number): void {
    const inputState = this.input.getState();

    // Update starfield always
    this.starfield.update(deltaTime);

    switch (this.state) {
      case GameState.TITLE:
        if (inputState.start) {
          this.startGame();
        }
        break;

      case GameState.PLAYING:
        this.updatePlaying(deltaTime);
        if (inputState.pause) {
          this.state = GameState.PAUSED;
        }
        break;

      case GameState.PAUSED:
        if (inputState.pause || inputState.start) {
          this.state = GameState.PLAYING;
        }
        break;

      case GameState.WAVE_TRANSITION:
        this.transitionTimer -= deltaTime * 1000;
        if (this.transitionTimer <= 0) {
          this.waveManager.spawnWave();
          this.energy = CONFIG.ENERGY.MAX;
          this.energyWarningPlayed = false;
          this.state = GameState.PLAYING;
        }
        break;

      case GameState.PLAYER_DEATH:
        this.particles.update(deltaTime);
        this.deathTimer -= deltaTime * 1000;
        if (this.deathTimer <= 0) {
          if (this.lives > 0) {
            this.player.reset();
            this.enemyBullets = [];
            this.state = GameState.PLAYING;
          } else {
            this.audio.play('gameOver');
            this.state = GameState.GAME_OVER;
          }
        }
        break;

      case GameState.GAME_OVER:
      case GameState.VICTORY:
        if (inputState.start) {
          this.startGame();
        }
        break;
    }

    // Update screen shake
    this.shakeIntensity *= this.shakeDecay;
    if (this.shakeIntensity < 0.1) this.shakeIntensity = 0;
  }

  private updatePlaying(deltaTime: number): void {
    const inputState = this.input.getState();

    // Update power-up timers
    if (performance.now() >= this.rapidFireEndTime) {
      this.player.rapidFire = false;
    }

    // Update player
    this.player.handleInput(inputState, deltaTime);
    this.player.update(deltaTime);

    // Player shooting
    if (inputState.fire && this.player.canFire(this.bullets.length)) {
      this.bullets.push(this.player.fire());
      this.audio.play('shoot');
    }

    // Update bullets
    this.bullets.forEach((b) => b.update(deltaTime));
    this.bullets = this.bullets.filter((b) => b.active);

    // Update enemy bullets
    this.enemyBullets.forEach((b) => b.update(deltaTime));
    this.enemyBullets = this.enemyBullets.filter((b) => b.active);

    // Update enemies
    this.waveManager.update(deltaTime);

    // Enemy shooting
    this.waveManager.activeEnemies.forEach((enemy) => {
      if (enemy.canFire() && Math.random() < 0.02) {
        const bullet = enemy.fire(this.player.centerX);
        if (bullet) {
          this.enemyBullets.push(bullet);
        }
      }
    });

    // Update power-ups
    this.powerUps.forEach((p) => p.update(deltaTime));
    this.powerUps = this.powerUps.filter((p) => p.active);

    // Update particles
    this.particles.update(deltaTime);

    // Drain energy
    this.energy -= CONFIG.ENERGY.DRAIN_RATE * deltaTime;
    if (this.energy <= CONFIG.ENERGY.WARNING_THRESHOLD && !this.energyWarningPlayed) {
      this.audio.play('energyWarning');
      this.energyWarningPlayed = true;
    }
    if (this.energy <= 0) {
      this.killPlayer();
      return;
    }

    // Check collisions
    this.checkCollisions();

    // Check wave completion
    if (this.waveManager.isWaveComplete()) {
      this.completeWave();
    }

    // Check victory
    if (this.score.isVictory()) {
      this.state = GameState.VICTORY;
    }
  }

  private checkCollisions(): void {
    const enemies = this.waveManager.activeEnemies;

    // Bullets vs enemies
    for (const bullet of this.bullets) {
      if (!bullet.active) continue;

      for (const enemy of enemies) {
        if (!enemy.active) continue;

        if (bullet.intersects(enemy)) {
          bullet.active = false;
          enemy.active = false;
          this.waveManager.removeEnemy(enemy);

          this.score.addScore(enemy.points);
          this.audio.play('enemyHit');
          this.particles.createEnemyExplosion(enemy.centerX, enemy.centerY, this.getEnemyColor(enemy));

          // Power-up drop
          if (PowerUp.shouldDrop()) {
            this.powerUps.push(new PowerUp(enemy.centerX, enemy.centerY));
          }

          // Check for extra life
          if (this.score.checkExtraLife() && this.lives < CONFIG.PLAYER.MAX_LIVES) {
            this.lives++;
            this.audio.play('extraLife');
          }
          break;
        }
      }
    }

    // Skip player collisions if invincible
    if (this.player.isInvincible) return;

    // Enemy bullets vs player
    for (const bullet of this.enemyBullets) {
      if (!bullet.active) continue;

      if (bullet.intersects(this.player)) {
        bullet.active = false;
        if (this.player.hasShield) {
          this.player.hasShield = false;
          this.audio.play('powerUp');
        } else {
          this.killPlayer();
          return;
        }
      }
    }

    // Enemies vs player
    for (const enemy of enemies) {
      if (!enemy.active) continue;

      if (enemy.intersects(this.player)) {
        if (this.player.hasShield) {
          this.player.hasShield = false;
          enemy.active = false;
          this.waveManager.removeEnemy(enemy);
          this.particles.createEnemyExplosion(enemy.centerX, enemy.centerY, this.getEnemyColor(enemy));
          this.audio.play('powerUp');
        } else {
          this.killPlayer();
          return;
        }
      }
    }

    // Power-ups vs player
    for (const powerUp of this.powerUps) {
      if (!powerUp.active) continue;

      if (powerUp.intersects(this.player)) {
        powerUp.active = false;
        this.collectPowerUp(powerUp);
      }
    }
  }

  private collectPowerUp(powerUp: PowerUp): void {
    this.score.addScore(CONFIG.SCORING.POWER_UP);
    this.audio.play('powerUp');
    this.particles.createPowerUpCollect(powerUp.centerX, powerUp.centerY, this.getPowerUpColor(powerUp.type));

    switch (powerUp.type) {
      case PowerUpType.RAPID_FIRE:
        this.player.rapidFire = true;
        this.rapidFireEndTime = performance.now() + CONFIG.POWERUP.RAPID_FIRE_DURATION;
        break;
      case PowerUpType.SHIELD:
        this.player.hasShield = true;
        break;
      case PowerUpType.ENERGY_BOOST:
        this.energy = Math.min(this.energy + CONFIG.POWERUP.ENERGY_BOOST, CONFIG.ENERGY.MAX);
        this.energyWarningPlayed = false;
        break;
      case PowerUpType.SCORE_MULTIPLIER:
        this.score.activateMultiplier();
        break;
    }
  }

  private getEnemyColor(enemy: Enemy): string {
    const colors: Record<string, string> = {
      HAMBURGER: '#D4A24C',
      COOKIE: '#D2691E',
      BUG: '#228B22',
      RADIAL_TIRE: '#333333',
      DIAMOND: '#00DDFF',
      STEAM_IRON: '#708090',
      BOW_TIE: '#FF1493',
      SPACE_DICE: '#FFFFFF',
    };
    return colors[enemy.type] || '#FFFFFF';
  }

  private getPowerUpColor(type: PowerUpType): string {
    const colors: Record<PowerUpType, string> = {
      [PowerUpType.RAPID_FIRE]: '#FF6600',
      [PowerUpType.SHIELD]: '#00FFFF',
      [PowerUpType.ENERGY_BOOST]: '#00FF00',
      [PowerUpType.SCORE_MULTIPLIER]: '#FFFF00',
    };
    return colors[type];
  }

  private killPlayer(): void {
    this.lives--;
    this.audio.play('playerHit');
    this.particles.createPlayerExplosion(this.player.centerX, this.player.centerY);
    this.shake(15);
    this.player.active = false;
    this.deathTimer = 1500;
    this.state = GameState.PLAYER_DEATH;
  }

  private completeWave(): void {
    // Award bonus points
    this.score.addBonusPoints(this.waveManager.currentWavePoints, Math.floor(this.energy));
    this.audio.play('waveComplete');

    // Move to next wave
    this.waveManager.nextWave();
    this.transitionTimer = CONFIG.WAVE.TRANSITION_DELAY;
    this.state = GameState.WAVE_TRANSITION;

    // Clear bullets
    this.bullets = [];
    this.enemyBullets = [];
  }

  private startGame(): void {
    this.score.reset();
    this.waveManager.reset();
    this.player.reset();
    this.player.hasShield = false;
    this.player.rapidFire = false;
    this.bullets = [];
    this.enemyBullets = [];
    this.powerUps = [];
    this.particles.clear();
    this.lives = CONFIG.PLAYER.STARTING_LIVES;
    this.energy = CONFIG.ENERGY.MAX;
    this.energyWarningPlayed = false;
    this.waveManager.spawnWave();
    this.state = GameState.PLAYING;
  }

  private shake(intensity: number): void {
    this.shakeIntensity = intensity;
  }

  private render(): void {
    const ctx = this.ctx;

    // Apply screen shake
    ctx.save();
    if (this.shakeIntensity > 0) {
      const shakeX = (Math.random() - 0.5) * this.shakeIntensity;
      const shakeY = (Math.random() - 0.5) * this.shakeIntensity;
      ctx.translate(shakeX, shakeY);
    }

    // Clear screen
    ctx.fillStyle = CONFIG.COLORS.BACKGROUND;
    ctx.fillRect(0, 0, CONFIG.GAME_WIDTH, CONFIG.GAME_HEIGHT);

    // Draw starfield
    this.starfield.render(ctx);

    switch (this.state) {
      case GameState.TITLE:
        this.renderTitle();
        break;
      case GameState.PLAYING:
      case GameState.PAUSED:
      case GameState.WAVE_TRANSITION:
      case GameState.PLAYER_DEATH:
        this.renderGame();
        if (this.state === GameState.PAUSED) {
          this.renderPauseOverlay();
        }
        if (this.state === GameState.WAVE_TRANSITION) {
          this.renderWaveTransition();
        }
        break;
      case GameState.GAME_OVER:
        this.renderGame();
        this.renderGameOver();
        break;
      case GameState.VICTORY:
        this.renderGame();
        this.renderVictory();
        break;
    }

    ctx.restore();
  }

  private renderGame(): void {
    const ctx = this.ctx;

    // Draw power-ups
    this.powerUps.forEach((p) => p.render(ctx));

    // Draw enemies
    this.waveManager.activeEnemies.forEach((e) => e.render(ctx));

    // Draw enemy bullets
    this.enemyBullets.forEach((b) => b.render(ctx));

    // Draw player (if active)
    if (this.player.active) {
      this.player.render(ctx);
    }

    // Draw player bullets
    this.bullets.forEach((b) => b.render(ctx));

    // Draw particles
    this.particles.render(ctx);

    // Draw HUD
    this.renderHUD();
  }

  private renderHUD(): void {
    const ctx = this.ctx;

    // Score
    ctx.fillStyle = CONFIG.COLORS.SCORE;
    ctx.font = 'bold 20px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`SCORE: ${this.score.score.toString().padStart(6, '0')}`, 10, 30);

    // High score
    ctx.fillStyle = CONFIG.COLORS.UI_TEXT;
    ctx.font = '14px monospace';
    ctx.fillText(`HI: ${this.score.highScore.toString().padStart(6, '0')}`, 10, 50);

    // Score multiplier indicator
    if (this.score.hasMultiplier) {
      ctx.fillStyle = '#FFFF00';
      ctx.fillText('x2 ACTIVE', 10, 70);
    }

    // Lives
    ctx.fillStyle = CONFIG.COLORS.PLAYER;
    for (let i = 0; i < this.lives; i++) {
      ctx.beginPath();
      ctx.ellipse(CONFIG.GAME_WIDTH - 25 - i * 25, 25, 8, 4, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Wave indicator
    ctx.fillStyle = CONFIG.COLORS.UI_TEXT;
    ctx.textAlign = 'right';
    ctx.font = '14px monospace';
    ctx.fillText(`WAVE ${this.waveManager.wave + 1}-${this.waveManager.cycle}`, CONFIG.GAME_WIDTH - 10, 50);

    // Energy bar
    const barWidth = 200;
    const barHeight = 12;
    const barX = (CONFIG.GAME_WIDTH - barWidth) / 2;
    const barY = CONFIG.GAME_HEIGHT - 25;

    // Background
    ctx.fillStyle = CONFIG.COLORS.ENERGY_BAR_BG;
    ctx.fillRect(barX, barY, barWidth, barHeight);

    // Energy level
    const energyPercent = this.energy / CONFIG.ENERGY.MAX;
    const isLow = this.energy <= CONFIG.ENERGY.WARNING_THRESHOLD;
    ctx.fillStyle = isLow ? CONFIG.COLORS.ENERGY_BAR_LOW : CONFIG.COLORS.ENERGY_BAR;

    // Pulse when low
    if (isLow && Math.floor(performance.now() / 200) % 2 === 0) {
      ctx.fillStyle = '#FF6600';
    }

    ctx.fillRect(barX, barY, barWidth * energyPercent, barHeight);

    // Border
    ctx.strokeStyle = CONFIG.COLORS.UI_TEXT;
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barWidth, barHeight);

    // Energy label
    ctx.fillStyle = CONFIG.COLORS.UI_TEXT;
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('ENERGY', CONFIG.GAME_WIDTH / 2, barY - 4);
  }

  private renderTitle(): void {
    const ctx = this.ctx;

    // Title
    ctx.fillStyle = '#FFFF00';
    ctx.font = 'bold 48px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('MEGAMANIA', CONFIG.GAME_WIDTH / 2, 200);

    // Subtitle
    ctx.fillStyle = '#00AAFF';
    ctx.font = '16px monospace';
    ctx.fillText('A MODERN RECREATION', CONFIG.GAME_WIDTH / 2, 240);

    // High score
    ctx.fillStyle = CONFIG.COLORS.UI_TEXT;
    ctx.font = '18px monospace';
    ctx.fillText(`HIGH SCORE: ${this.score.highScore.toString().padStart(6, '0')}`, CONFIG.GAME_WIDTH / 2, 320);

    // Start prompt
    const blink = Math.floor(performance.now() / 500) % 2 === 0;
    if (blink) {
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '20px monospace';
      ctx.fillText('TAP OR PRESS SPACE TO START', CONFIG.GAME_WIDTH / 2, 420);
    }

    // Controls
    ctx.fillStyle = '#888888';
    ctx.font = '12px monospace';
    ctx.fillText('KEYBOARD: ARROWS/AD - MOVE | SPACE/Z - FIRE', CONFIG.GAME_WIDTH / 2, 500);
    ctx.fillText('TOUCH: TAP LEFT/RIGHT - MOVE | TAP - FIRE', CONFIG.GAME_WIDTH / 2, 520);
    ctx.fillText('P / ESC - PAUSE', CONFIG.GAME_WIDTH / 2, 540);
  }

  private renderPauseOverlay(): void {
    const ctx = this.ctx;

    // Dim overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, CONFIG.GAME_WIDTH, CONFIG.GAME_HEIGHT);

    // Pause text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 36px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', CONFIG.GAME_WIDTH / 2, CONFIG.GAME_HEIGHT / 2);

    ctx.font = '16px monospace';
    ctx.fillText('Press P or ESC to resume', CONFIG.GAME_WIDTH / 2, CONFIG.GAME_HEIGHT / 2 + 40);
  }

  private renderWaveTransition(): void {
    const ctx = this.ctx;

    // Wave announcement
    const waveName = WAVE_ORDER[this.waveManager.wave];
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 28px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`WAVE ${this.waveManager.wave + 1}`, CONFIG.GAME_WIDTH / 2, CONFIG.GAME_HEIGHT / 2 - 20);

    ctx.font = '18px monospace';
    ctx.fillStyle = '#FFFF00';
    ctx.fillText(waveName.replace('_', ' '), CONFIG.GAME_WIDTH / 2, CONFIG.GAME_HEIGHT / 2 + 15);

    if (this.waveManager.cycle > 1) {
      ctx.fillStyle = '#FF6600';
      ctx.font = '14px monospace';
      ctx.fillText(`MEGACYCLE ${this.waveManager.cycle}`, CONFIG.GAME_WIDTH / 2, CONFIG.GAME_HEIGHT / 2 + 45);
    }
  }

  private renderGameOver(): void {
    const ctx = this.ctx;

    // Dim overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, CONFIG.GAME_WIDTH, CONFIG.GAME_HEIGHT);

    // Game over text
    ctx.fillStyle = '#FF0000';
    ctx.font = 'bold 48px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', CONFIG.GAME_WIDTH / 2, CONFIG.GAME_HEIGHT / 2 - 40);

    // Score
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '24px monospace';
    ctx.fillText(`SCORE: ${this.score.score.toString().padStart(6, '0')}`, CONFIG.GAME_WIDTH / 2, CONFIG.GAME_HEIGHT / 2 + 20);

    // New high score
    if (this.score.isNewHighScore()) {
      ctx.fillStyle = '#FFFF00';
      ctx.font = '18px monospace';
      ctx.fillText('NEW HIGH SCORE!', CONFIG.GAME_WIDTH / 2, CONFIG.GAME_HEIGHT / 2 + 55);
    }

    // Restart prompt
    const blink = Math.floor(performance.now() / 500) % 2 === 0;
    if (blink) {
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '16px monospace';
      ctx.fillText('TAP OR PRESS SPACE TO PLAY AGAIN', CONFIG.GAME_WIDTH / 2, CONFIG.GAME_HEIGHT / 2 + 100);
    }
  }

  private renderVictory(): void {
    const ctx = this.ctx;

    // Dim overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, CONFIG.GAME_WIDTH, CONFIG.GAME_HEIGHT);

    // Victory text
    ctx.fillStyle = '#FFFF00';
    ctx.font = 'bold 36px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('CONGRATULATIONS!', CONFIG.GAME_WIDTH / 2, CONFIG.GAME_HEIGHT / 2 - 60);

    ctx.fillStyle = '#00FF00';
    ctx.font = 'bold 28px monospace';
    ctx.fillText('YOU ARE A MEGAMANIAC!', CONFIG.GAME_WIDTH / 2, CONFIG.GAME_HEIGHT / 2 - 10);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '20px monospace';
    ctx.fillText(`FINAL SCORE: ${this.score.score.toString().padStart(6, '0')}`, CONFIG.GAME_WIDTH / 2, CONFIG.GAME_HEIGHT / 2 + 40);

    // Restart prompt
    const blink = Math.floor(performance.now() / 500) % 2 === 0;
    if (blink) {
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '16px monospace';
      ctx.fillText('TAP OR PRESS SPACE TO PLAY AGAIN', CONFIG.GAME_WIDTH / 2, CONFIG.GAME_HEIGHT / 2 + 100);
    }
  }
}
