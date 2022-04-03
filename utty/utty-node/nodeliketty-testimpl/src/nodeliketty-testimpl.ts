import NodeLikeTty, { Direction } from "nodeliketty";
export default class TestImpl implements NodeLikeTty {
  lines: string[] = [""];
  y = 0;
  x = 0;
  resizeListeners: (() => void)[] = [];
  private _columns: number = 100;
  get columns(): number {
    return this._columns;
  }
  set columns(col: number) {
    this._columns = col;
    this.callResizeListener();
  }
  private _rows: number = 100;
  get rows(): number {
    return this._rows;
  }
  set rows(row: number) {
    this._rows = row;
    this.callResizeListener();
  }
  callResizeListener() {
    this.resizeListeners.forEach((value) => value());
  }
  on(_event: "resize", listener: () => void): this {
    this.resizeListeners.push(listener);
    return this;
  }
  getColorDepth(): number {
    return 24;
  }
  write(buffer: Uint8Array | string, cb?: (err?: Error) => void): boolean {
    for (let c of buffer) {
      if (c === "\n") {
        this.y++;
        this.x = 0;
        this.lines.push("");
      } else {
        this.x++;
        this.lines[this.y] += c;
      }
    }
    return true;
  }
  clearLine(dir: Direction): boolean {
    this.lines[this.y] = "";
    this.x = 0;
    return true;
  }
  moveCursor(dx: number, dy: number): boolean {
    this.x += dx;
    this.y += dy;
    return true;
  }
  cursorTo(x: number, y?: number): boolean {
    this.x = x;
    if (y !== undefined) this.y = y;
    return true;
  }
}