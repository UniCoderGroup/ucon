export default class Canvas {
  constructor(parent: Canvas | null, x: number, y: number) {
    this.parent = parent;
    this.x = x;
    this.y = y;
  }
  parent: Canvas | null;
  x: number;
  y: number;
  cx?: number;
  cy?: number;
  get absX(): number {
    return this.x + (this.parent === null ? 0 : this.absX);
  }
  get absY(): number {
    return this.y + (this.parent === null ? 0 : this.absY);
  }
}
