export interface InputState {
  left: boolean;
  right: boolean;
  fire: boolean;
  pause: boolean;
  start: boolean;
}

export class InputManager {
  private keys: Set<string> = new Set();
  private previousKeys: Set<string> = new Set();
  private touchLeft: boolean = false;
  private touchRight: boolean = false;
  private touchFire: boolean = false;
  private previousTouchFire: boolean = false;

  constructor() {
    this.setupKeyboard();
    this.setupTouch();
  }

  private setupKeyboard(): void {
    window.addEventListener('keydown', (e) => {
      this.keys.add(e.code);
      // Prevent default for game keys
      if (['ArrowLeft', 'ArrowRight', 'Space', 'KeyP', 'Escape', 'Enter'].includes(e.code)) {
        e.preventDefault();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
    });

    // Handle window blur
    window.addEventListener('blur', () => {
      this.keys.clear();
    });
  }

  private setupTouch(): void {
    const canvas = document.getElementById('game-canvas');
    if (!canvas) return;

    const handleTouch = (e: TouchEvent, active: boolean) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const centerX = rect.width / 2;

      this.touchLeft = false;
      this.touchRight = false;
      this.touchFire = active;

      if (active) {
        for (let i = 0; i < e.touches.length; i++) {
          const touch = e.touches[i];
          const x = touch.clientX - rect.left;

          if (x < centerX) {
            this.touchLeft = true;
          } else {
            this.touchRight = true;
          }
        }
      }
    };

    canvas.addEventListener('touchstart', (e) => handleTouch(e, true), { passive: false });
    canvas.addEventListener('touchmove', (e) => handleTouch(e, true), { passive: false });
    canvas.addEventListener('touchend', (e) => handleTouch(e, e.touches.length > 0), { passive: false });
    canvas.addEventListener('touchcancel', () => {
      this.touchLeft = false;
      this.touchRight = false;
      this.touchFire = false;
    });
  }

  update(): void {
    this.previousKeys = new Set(this.keys);
    this.previousTouchFire = this.touchFire;
  }

  getState(): InputState {
    return {
      left: this.keys.has('ArrowLeft') || this.keys.has('KeyA') || this.touchLeft,
      right: this.keys.has('ArrowRight') || this.keys.has('KeyD') || this.touchRight,
      fire: this.keys.has('Space') || this.keys.has('KeyZ') || this.touchFire,
      pause: this.isJustPressed('KeyP') || this.isJustPressed('Escape'),
      start: this.isJustPressed('Space') || this.isJustPressed('Enter') || this.isTouchJustPressed(),
    };
  }

  private isTouchJustPressed(): boolean {
    return this.touchFire && !this.previousTouchFire;
  }

  private isJustPressed(code: string): boolean {
    return this.keys.has(code) && !this.previousKeys.has(code);
  }
}
