import { CONFIG, WAVE_ORDER, EnemyType } from '../game/Config';
import {
  Enemy,
  Hamburger,
  Cookie,
  Bug,
  RadialTire,
  Diamond,
  SteamIron,
  BowTie,
  SpaceDice,
} from '../entities/Enemy';

export class WaveManager {
  private currentWave: number = 0;
  private megaCycle: number = 1;
  private enemies: Enemy[] = [];

  get wave(): number {
    return this.currentWave;
  }

  get cycle(): number {
    return this.megaCycle;
  }

  get activeEnemies(): Enemy[] {
    return this.enemies;
  }

  get currentWaveType(): EnemyType {
    return WAVE_ORDER[this.currentWave];
  }

  get currentWavePoints(): number {
    const enemyType = this.currentWaveType;
    if (this.megaCycle > 1) return 90;
    return CONFIG.ENEMIES[enemyType].points;
  }

  reset(): void {
    this.currentWave = 0;
    this.megaCycle = 1;
    this.enemies = [];
  }

  spawnWave(): void {
    this.enemies = [];
    const enemyType = WAVE_ORDER[this.currentWave];
    const config = { megaCycle: this.megaCycle };

    switch (enemyType) {
      case 'HAMBURGER':
        this.spawnHamburgers(config);
        break;
      case 'COOKIE':
        this.spawnCookies(config);
        break;
      case 'BUG':
        this.spawnBugs(config);
        break;
      case 'RADIAL_TIRE':
        this.spawnRadialTires(config);
        break;
      case 'DIAMOND':
        this.spawnDiamonds(config);
        break;
      case 'STEAM_IRON':
        this.spawnSteamIrons(config);
        break;
      case 'BOW_TIE':
        this.spawnBowTies(config);
        break;
      case 'SPACE_DICE':
        this.spawnSpaceDice(config);
        break;
    }
  }

  private spawnHamburgers(config: { megaCycle: number }): void {
    for (let i = 0; i < CONFIG.WAVE.ENEMY_COUNT; i++) {
      const x = 50 + (i % 4) * 100;
      const y = 60 + Math.floor(i / 4) * 50;
      this.enemies.push(new Hamburger(x, y, config));
    }
  }

  private spawnCookies(config: { megaCycle: number }): void {
    for (let i = 0; i < CONFIG.WAVE.ENEMY_COUNT; i++) {
      const x = 60 + (i % 4) * 100;
      const y = 40 + Math.floor(i / 4) * 40;
      const waveOffset = i * 0.5;
      this.enemies.push(new Cookie(x, y, config, waveOffset));
    }
  }

  private spawnBugs(config: { megaCycle: number }): void {
    for (let i = 0; i < CONFIG.WAVE.ENEMY_COUNT; i++) {
      const x = 50 + (i % 4) * 100;
      const y = 80 + Math.floor(i / 4) * 40;
      const waveOffset = i * 0.3;
      this.enemies.push(new Bug(x, y, config, waveOffset));
    }
  }

  private spawnRadialTires(config: { megaCycle: number }): void {
    for (let i = 0; i < CONFIG.WAVE.ENEMY_COUNT; i++) {
      const x = 60 + (i % 4) * 100;
      const y = 30 + Math.floor(i / 4) * 50;
      const row = Math.floor(i / 4);
      const waveOffset = i * 0.4;
      this.enemies.push(new RadialTire(x, y, config, waveOffset, row));
    }
  }

  private spawnDiamonds(config: { megaCycle: number }): void {
    for (let i = 0; i < CONFIG.WAVE.ENEMY_COUNT; i++) {
      const x = 50 + (i % 4) * 100;
      const y = 60 + Math.floor(i / 4) * 45;
      const waveOffset = i * 0.6;
      this.enemies.push(new Diamond(x, y, config, waveOffset));
    }
  }

  private spawnSteamIrons(config: { megaCycle: number }): void {
    const columns = [80, CONFIG.GAME_WIDTH / 2, CONFIG.GAME_WIDTH - 80];
    for (let i = 0; i < CONFIG.WAVE.ENEMY_COUNT; i++) {
      const colIndex = i % 3;
      const x = columns[colIndex] - 14;
      const y = 40 + Math.floor(i / 3) * 60;
      this.enemies.push(new SteamIron(x, y, config, colIndex));
    }
  }

  private spawnBowTies(config: { megaCycle: number }): void {
    for (let i = 0; i < CONFIG.WAVE.ENEMY_COUNT; i++) {
      const x = 60 + (i % 4) * 100;
      const y = 60 + Math.floor(i / 4) * 50;
      this.enemies.push(new BowTie(x, y, config));
    }
  }

  private spawnSpaceDice(config: { megaCycle: number }): void {
    for (let i = 0; i < CONFIG.WAVE.ENEMY_COUNT; i++) {
      const x = 50 + (i % 4) * 100;
      const y = 30 + Math.floor(i / 4) * 50;
      this.enemies.push(new SpaceDice(x, y, config));
    }
  }

  removeEnemy(enemy: Enemy): void {
    const index = this.enemies.indexOf(enemy);
    if (index !== -1) {
      this.enemies.splice(index, 1);
    }
  }

  isWaveComplete(): boolean {
    return this.enemies.length === 0;
  }

  nextWave(): void {
    this.currentWave++;
    if (this.currentWave >= WAVE_ORDER.length) {
      this.currentWave = 0;
      this.megaCycle++;
    }
  }

  update(deltaTime: number): void {
    this.enemies.forEach((enemy) => enemy.update(deltaTime));
    this.enemies = this.enemies.filter((enemy) => enemy.active);
  }
}
