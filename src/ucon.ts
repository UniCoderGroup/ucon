import {ContainerComponent,InlineComponent} from "./components";
import UTty from "utty";
import {Line,createLine,Midware,RefMidware} from "./line";
import { combiner } from "./std_components/inline";
import { ContentsArgs } from "./global";

export type ContainerStack = ContainerComponent[];

export interface ConWithUTty {
  get tty(): UTty;
  get lineNum(): number;
}
export interface ConForBlock extends ConWithUTty {
  get stack(): ContainerStack;
  insertLine(y: number, line: Line): void;
  deleteLine(line: Line): void;
  addLine(content: InlineComponent): Line;
  redraw(line: Line): void;
}
export interface ConForContainer extends ConWithUTty {
  registerContainer(container: ContainerComponent): void;
  unregisterContainer(container: ContainerComponent): void
  addLine(content: InlineComponent): Line;
  log(...objs: ContentsArgs): Line;
}
export interface ConForInline extends ConWithUTty {

}

/**
 * Main.
 */
export class UCon implements ConForBlock, ConForContainer, ConForInline {
  constructor() {
  }

  /**
   * An instance of UTty.
   */
  tty = new UTty(process.stdout);

  /**
   * Lines. Each Line may have more than one real line.
   */
  lines: Line[] = [];

  /**
   * Components that will add a midware to currentline.
   */
  stack: ContainerStack = [];

  get lineNum(): number {
    return this.lines.length;
  }

  /**
   * Redraw the line.
   * @param line Line to redraw
   */
  redraw(line: Line): void {
    this.tty.redraw(line.y, line.render());
  }

  b = 0;
  /**
   * Insert a line.
   */
  insertLine(y: number, line: Line): void {
    line.y = y;
    this.lines.push(this.lines[this.lines.length - 1]);
    for (let i = this.lines.length - 1; i > y; i--) {
      this.lines[i] = this.lines[i - 1];
      this.lines[i].y++;
      this.redraw(this.lines[i]);
    }
    this.lines[y] = line;
    this.redraw(line);
  }

  /**
   * Delete a line.
   */
  deleteLine(line: Line): void {
    if (this.lines[line.y] !== line) {
      throw new Error("This line has already been detached!");
    }
    for (let i = line.y + 1; i < this.lineNum; i++) {
      this.lines[i - 1] = this.lines[i];
      this.lines[i - 1].y--;
      this.redraw(this.lines[i - 1]);
    }
    this.lines.pop();
    this.tty.moveToLine(this.lineNum);
    this.tty.yMax--;
    this.tty.clearLine(0);
  }

  /**
   * Add a line in the end of lines.
   */
  addLine(content: InlineComponent): Line {
    const currentLine = createLine(this.stack, content);
    currentLine.y = this.lineNum;
    this.lines.push(currentLine);
    this.tty.output(currentLine.render());
    return currentLine;
  }

  getMidware(ref: RefMidware): Midware {
    // [TODO]:Add Asserts.
    return ref.line.midwares[ref.midware];
  }

  setMidware(ref: RefMidware, newOne: Midware, redraw: boolean = true): void {
    // [TODO]:Add Asserts.
    ref.line.midwares[ref.midware] = newOne;
    if (redraw) this.redraw(ref.line);
  }

  registerContainer(container: ContainerComponent): void {
    this.stack.push(container);
  }

  unregisterContainer(container: ContainerComponent): void {
    let pop = this.stack.pop();
    if (pop !== container) {
      if (pop !== undefined) {
        this.stack.push(pop);
      }
      throw new Error("This ContainerComponent wrongly unregistered!");
    }
  }

  /**
   * Main log function.
   */
  log(...objs: ContentsArgs): Line {
    return this.addLine(combiner(...objs));
  }
}