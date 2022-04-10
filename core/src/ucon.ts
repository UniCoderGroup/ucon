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
import { FocusTarget } from "./focus.js";
import { InputIP } from ".";

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
  focus: FocusTarget | null;
  getFocusInnerPos(focus: FocusTarget): InputIP<FocusTarget>|undefined;
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
   * Lines. Each Line may have more than one real line.
   */
  lines: Line[] = [];

  /**
   * Components that will add a midware to currentline.
   */
  stack: ContainerStack = [];

  /**
   * Focus of inputing.
   */
  focus: FocusTarget | null = null;
  protected focusInnerPos: InputIP<FocusTarget>|undefined;

  get lineNum(): number {
    return this.lines.length;
  }

  getFocusInnerPos(focus: FocusTarget): InputIP<FocusTarget>|undefined {
    if (this.focus === focus) {
      return this.focusInnerPos;
    } else {
      return undefined;
    }
  }

  /**
   * Redraw the line.
   * @param line Line to redraw
   */
  redraw(line: Line): void {
    this.tty.replace(line.y, line.render());
  }

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
    this.tty.popLine();
  }

  /**
   * Add a line in the end of lines.
   */
  addLine(content: InlineComponent): Line {
    const currentLine = createLine(this.stack, content);
    currentLine.y = this.lineNum;
    this.lines.push(currentLine);
    this.tty.replace(currentLine.y, currentLine.render());
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
