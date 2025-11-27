export enum GameState {
  TITLE = 'TITLE',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  WAVE_TRANSITION = 'WAVE_TRANSITION',
  PLAYER_DEATH = 'PLAYER_DEATH',
  GAME_OVER = 'GAME_OVER',
  VICTORY = 'VICTORY',
}

export interface GameStats {
  score: number;
  highScore: number;
  lives: number;
  wave: number;
  megaCycle: number;
  energy: number;
  enemiesKilled: number;
}
