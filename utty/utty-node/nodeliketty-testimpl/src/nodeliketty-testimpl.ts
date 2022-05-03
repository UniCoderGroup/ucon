import NodeLikeTty, { Direction } from "nodeliketty";
export default class TestImpl implements NodeLikeTty {
  lines: string[] = [""];
  operateHistory: string[] = [];
  operateHistoryBlanks = 0;
  y = 0;
  x = 0;
  resizeListeners: (() => void)[] = [];
  private _columns: number = 100;

  opPush(str: any) {
    this.operateHistory.push("  ".repeat(this.operateHistoryBlanks) + str);
  }
  opStartFunc(name: string, ...args: any[]) {
    this.opPush(`CALL [${name}] (${args.join(", ")})`);
    this.operateHistoryBlanks++;
  }
  opEndFunc(retVal?: any) {
    this.operateHistoryBlanks--;
    this.opPush(` =>${retVal ?? "void"}`);
  }

  get columns(): number {
    this.opStartFunc(`get columns`);
    this.opEndFunc(this._columns);
    return this._columns;
  }
  set columns(col: number) {
    this.opStartFunc(`set columns`, col);
    this.opPush(`SET this._columns TO ${col}`);
    this._columns = col;
    this.callResizeListener();
    this.opEndFunc();
  }
  private _rows: number = 100;
  get rows(): number {
    this.opStartFunc(`get rows`);
    this.opEndFunc(this._rows);
    return this._rows;
  }
  set rows(row: number) {
    this.opStartFunc(`set rows`, row);
    this.opPush(`SET this._rows TO ${row}`);
    this._rows = row;
    this.callResizeListener();
    this.opEndFunc();
  }
  callResizeListener() {
    this.opStartFunc(`callResizeListener`);
    this.resizeListeners.forEach((value) => value());
    this.opEndFunc();
  }
  on(_event: "resize", listener: () => void): this {
    this.resizeListeners.push(listener);
    return this;
  }
  getColorDepth(): number {
    return 24;
  }
  write(buffer: Uint8Array | string, cb?: (err?: Error) => void): boolean {
    this.opStartFunc("write", buffer, cb);
    let crtLine = "";
    for (const c of buffer) {
      if (c === "\n") {
        this.opPush(`MEET \\n`);
        this.x += crtLine.length;
        this.opPush(`INCREASE X with ${crtLine.length}. NOW X IS ${this.x}`);
        this.lines[this.y] += crtLine;
        this.opPush(`ADD STRING ${crtLine} AT LINE[${this.y}]`);
        crtLine = "";
        this.y++;
        this.opPush(`this.y++;\t=>${this.y}`);
        this.x = 0;
        this.opPush("this.x = 0;");
        this.lines.push("");
        this.opPush(`this.lines.push(\"\");\t=>${this.lines.join(" | ")}`);
      } else {
        crtLine += c;
      }
    }
    this.x += crtLine.length;
    this.opPush(`INCREASE X with ${crtLine.length}. NOW X IS ${this.x}`);
    this.lines[this.y] += crtLine;
    this.opPush(`ADD STRING ${crtLine} AT LINE[${this.y}]`);
    this.opPush(`NOW LINES ARE  ${this.lines.join(" | ")}`);
    this.opEndFunc(true);
    return true;
  }
  clearLine(dir: Direction): boolean {
    this.opStartFunc("clearLine", dir);
    this.lines[this.y] = "";
    this.opPush(`this.lines[${this.y}] = \"\";\t=>${this.lines.join(" | ")}`);
    // [[IMPORTANT]] Currently, we found that nodejs doesn't move x coord when clearing a line.
    // this.x = 0;
    // this.opPush("this.x = 0;");
    this.opEndFunc(true);
    return true;
  }
  moveCursor(dx: number, dy: number): boolean {
    this.opStartFunc("moveCursor", dx, dy);
    this.x += dx;
    this.opPush(`this.x += dx(${dx});\t=>${this.x}`);
    this.y += dy;
    this.opPush(`this.y += dy(${dy});\t=>${this.y}`);
    this.opEndFunc(true);
    return true;
  }
  cursorTo(x: number, y?: number): boolean {
    this.opStartFunc("cursorTo", x, y);
    this.x = x;
    this.opPush(`this.x = x(${x});\t=>${this.x}`);
    if (y !== undefined) {
      this.y = y;
      this.opPush(`this.y = y(${y});\t=>${this.y}`);
    }
    this.opEndFunc(true);
    return true;
  }
}
