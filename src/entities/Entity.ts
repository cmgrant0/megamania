export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export abstract class Entity implements Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
  active: boolean = true;

  constructor(x: number, y: number, width: number, height: number) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  abstract update(deltaTime: number): void;
  abstract render(ctx: CanvasRenderingContext2D): void;

  get centerX(): number {
    return this.x + this.width / 2;
  }

  get centerY(): number {
    return this.y + this.height / 2;
  }

  get left(): number {
    return this.x;
  }

  get right(): number {
    return this.x + this.width;
  }

  get top(): number {
    return this.y;
  }

  get bottom(): number {
    return this.y + this.height;
  }

  intersects(other: Rectangle): boolean {
    return (
      this.left < other.x + other.width &&
      this.right > other.x &&
      this.top < other.y + other.height &&
      this.bottom > other.y
    );
  }
}
