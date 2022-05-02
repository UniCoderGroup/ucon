import {
  ContainerComponent,
  InlineComponent,
  ContainerBA,
  ContainerEA,
  Component,
  InputComponent,
} from "./component.js";
import UTty from "utty";
import { Line, createLine, Midware, RefMidware } from "./line.js";
import { combiner } from "./std_components.js";
import { ContentsArgs } from "./global.js";
import { __dev_logger } from "./_development.js";
import { FocusMap } from "focus-system";

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
  unregisterContainer(container: ContainerComponent): void;
  addLine(content: InlineComponent): Line;
  log(...objs: ContentsArgs): Line;
}

export type ConForInline = ConWithUTty;

export interface ConForInput extends ConWithUTty {
  get focusMap(): FocusMap;
}

/**
 * Main.
 */
export default class UCon
  implements ConForBlock, ConForContainer, ConForInline, ConForInput
{
  constructor(tty: UTty) {
    this.tty = tty;
  }

  /**
   * An instance of UTty.
   */
  tty: UTty;

  /**
   * Map of focus.
   */
  focusMap: FocusMap = new FocusMap();

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
    __dev_logger.log(`tty.replace  @${line.y} =>${line.render()}`);
    this.tty.replace(line.y, line.render());
  }

  /**
   * Insert a line.
   */
  insertLine(y: number, line: Line): void {
    // 0A 1B 2C 3D
    // (if) A B C D X
    // push X
    // OK!
    // (else) e.g. y=1 todo: A X B C D
    // X.y = 1
    // => A B C D D (length = 5)
    // (loop until i = 1)
    // i = 3 => A B C C D  & redraw C
    // i = 2 => A B B C D  & redraw B
    // i = 1 => (exit loop)
    //
    // => A X B C D
    // redraw X
    if (y === this.lines.length) {
      this.pushLine(line);
      return;
    }
    line.y = y;
    this.pushLine(this.lines[this.lines.length - 1]);
    for (let i = this.lines.length - 2; i > y; i--) {
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
    __dev_logger.log(`tty.popLine`);
    this.tty.popLine();
  }

  /**
   * Add a line in the end of lines.
   */
  addLine(content: InlineComponent): Line {
    const currentLine = createLine(this.stack, content);
    this.pushLine(currentLine);
    return currentLine;
  }

  pushLine(line: Line) {
    line.y = this.lineNum;
    this.lines.push(line);
    __dev_logger.log(`tty.pushLine  =>${line.render()}`);
    this.tty.pushLine(line.render());
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

  // /**
  //  * Use a ContainerComponent.
  //  */
  // use<C extends ContainerComponent>(c:C,...beginArgs:ContainerBA<C>):void{
  //   c.begin(...beginArgs);
  // }

  // unuse<C extends ContainerComponent>(c:C,...endArgs:ContainerEA<C>):void{
  //   c.end(...endArgs);
  // }
}
