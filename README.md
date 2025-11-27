# Megamania

A modern recreation of the classic Atari 2600 game Megamania, built with TypeScript and HTML5 Canvas.

## Play Online

[Play Megamania](https://megamania-production.up.railway.app) *(URL available after Railway deployment)*

## Features

- **All 8 Classic Enemy Waves**: Hamburgers, Cookies, Bugs, Radial Tires, Diamonds, Steam Irons, Bow Ties, and Space Dice
- **Authentic Wave Patterns**: Each enemy type has unique movement patterns faithful to the original
- **MegaCycle Difficulty**: After completing all 8 waves, the game loops with increased difficulty
- **Modernized Gameplay**:
  - Multiple shots (up to 3 bullets on screen)
  - Power-ups: Rapid Fire, Shield, Energy Boost, Score Multiplier
  - Smooth acceleration-based movement
- **Energy System**: Clear each wave before your energy depletes
- **Scoring**: First cycle 20-90 points per wave, bonus points for remaining energy
- **Local High Scores**: Your best score is saved locally

## Controls

| Action | Keyboard | Touch |
|--------|----------|-------|
| Move Left | ← or A | Tap left side |
| Move Right | → or D | Tap right side |
| Fire | Space or Z | Touch anywhere |
| Pause | P or Esc | - |
| Start/Continue | Space or Enter | Touch |

## Development

### Prerequisites

- Node.js 18+
- npm

### Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Project Structure

```
src/
├── main.ts              # Entry point
├── game/
│   ├── Game.ts          # Main game loop and state
│   ├── GameState.ts     # Game state enum
│   └── Config.ts        # Game constants
├── entities/
│   ├── Entity.ts        # Base entity class
│   ├── Player.ts        # Player ship
│   ├── Bullet.ts        # Projectiles
│   ├── Enemy.ts         # All 8 enemy types
│   └── PowerUp.ts       # Power-up items
├── waves/
│   └── WaveManager.ts   # Wave spawning and management
├── systems/
│   ├── InputManager.ts  # Keyboard/touch input
│   ├── AudioManager.ts  # Web Audio API sounds
│   └── ScoreManager.ts  # Scoring and high scores
└── rendering/
    ├── ParticleSystem.ts # Explosion effects
    └── Starfield.ts     # Background stars
```

## Deployment (Railway)

1. Connect your GitHub repository to Railway
2. Railway will automatically detect it as a Node.js project
3. Set the build command: `npm run build`
4. Set the start command: `npm run preview`
5. Deploy!

The game is a static site - Vite builds to the `dist/` folder.

## Original Game

Megamania was created by Steve Cartwright and published by Activision in 1982 for the Atari 2600. It features a unique take on the fixed shooter genre, replacing typical alien invaders with everyday objects like hamburgers and bow ties.

## License

MIT
