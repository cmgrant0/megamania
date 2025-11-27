// Game configuration constants
export const CONFIG = {
  // Canvas dimensions (internal resolution)
  GAME_WIDTH: 480,
  GAME_HEIGHT: 640,

  // Player settings
  PLAYER: {
    WIDTH: 40,
    HEIGHT: 24,
    SPEED: 300,
    ACCELERATION: 1200,
    FRICTION: 8,
    Y_OFFSET: 60, // Distance from bottom
    MAX_BULLETS: 3,
    FIRE_RATE: 150, // ms between shots
    STARTING_LIVES: 3,
    MAX_LIVES: 6,
    EXTRA_LIFE_SCORE: 10000,
    INVINCIBLE_TIME: 2000, // ms after respawn
  },

  // Bullet settings
  BULLET: {
    WIDTH: 4,
    HEIGHT: 16,
    SPEED: 600,
  },

  // Enemy bullet settings
  ENEMY_BULLET: {
    WIDTH: 4,
    HEIGHT: 8,
    SPEED: 250,
  },

  // Energy system
  ENERGY: {
    MAX: 80,
    DRAIN_RATE: 2, // units per second
    WARNING_THRESHOLD: 20,
  },

  // Wave settings
  WAVE: {
    ENEMY_COUNT: 8,
    TRANSITION_DELAY: 2000, // ms between waves
  },

  // Scoring
  SCORING: {
    POWER_UP: 100,
    MAX_SCORE: 999999,
  },

  // Power-up settings
  POWERUP: {
    DROP_CHANCE: 0.1, // 10% chance on enemy kill
    WIDTH: 24,
    HEIGHT: 24,
    FALL_SPEED: 100,
    RAPID_FIRE_DURATION: 10000,
    RAPID_FIRE_RATE: 75,
    SHIELD_HITS: 1,
    ENERGY_BOOST: 20,
    SCORE_MULTIPLIER: 2,
    SCORE_MULTIPLIER_DURATION: 15000,
  },

  // Visual settings
  COLORS: {
    BACKGROUND: '#000011',
    PLAYER: '#00AAFF',
    PLAYER_ACCENT: '#0066AA',
    BULLET: '#FFFF00',
    ENEMY_BULLET: '#FF4444',
    ENERGY_BAR: '#00FF00',
    ENERGY_BAR_LOW: '#FF0000',
    ENERGY_BAR_BG: '#333333',
    UI_TEXT: '#FFFFFF',
    SCORE: '#FFFF00',
  },

  // Enemy wave definitions (points and base speeds)
  ENEMIES: {
    HAMBURGER: { points: 20, speed: 120, fireRate: 3000 },
    COOKIE: { points: 30, speed: 80, fireRate: 2500 },
    BUG: { points: 40, speed: 100, fireRate: 2000 },
    RADIAL_TIRE: { points: 50, speed: 150, fireRate: 2500 },
    DIAMOND: { points: 60, speed: 110, fireRate: 1500 },
    STEAM_IRON: { points: 70, speed: 90, fireRate: 2000 },
    BOW_TIE: { points: 80, speed: 100, fireRate: 1200 },
    SPACE_DICE: { points: 90, speed: 130, fireRate: 1800 },
  },
} as const;

// Wave order
export const WAVE_ORDER = [
  'HAMBURGER',
  'COOKIE',
  'BUG',
  'RADIAL_TIRE',
  'DIAMOND',
  'STEAM_IRON',
  'BOW_TIE',
  'SPACE_DICE',
] as const;

export type EnemyType = typeof WAVE_ORDER[number];
