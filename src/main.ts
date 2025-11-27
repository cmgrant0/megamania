import { Game } from './game/Game';

// Start the game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const game = new Game();
  game.start();
});
