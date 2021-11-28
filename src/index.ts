import chalk from "chalk";
import { stdout } from "process";

/**
 * Main.
 */
export class UCon {
  /**
   * Curent y coord in terminal (start by 0).
   */
  y = 0;

  /**
   * The max of y
   */
  yMax = 0;

  /**
   * Lines. Each Line may have more than one real line.
   */
  lines: Line[] = [];

  /**
   * Components that will add a midware to currentline.
   */
  stack: ContainerComponent<unknown>[] = [];

  /**
   * Main log function.
   */
  log(...objs: InlineComponent<unknown>[] | string[]): Line {
    const currentLine = new Line(this.y, combiner(objs));
    for (const compo of this.stack) {
      currentLine.midwares.push(
        compo.newLine({
          line: currentLine,
          midware: currentLine.midwares.length,
        })
      );
    }
    this.lines.push(currentLine);

    this.output(currentLine.render());
    return currentLine;
  }

  /**
   * Write str and `'\n'` to stdout,
   * and add this.y according to number of `'\n'`s.
   */
  output(str: string, addYMax: boolean = true): void {
    stdout.write(str + "\n");
    for (let c of str) {
      if (c === "\n") {
        this.y++;
        if (addYMax) this.yMax++;
      }
    }
    this.y++; // add the additional "\n"
    if (addYMax) this.yMax++;
  }

  /**
   *  Reset `x` coord to 0
   */
  resetX(): void {
    stdout.cursorTo(0);
  }

  /**
   * Move y coord of cursor
   * and add `dy` to `this.y`
   */
  moveY(dy: number): void {
    stdout.moveCursor(0, dy);
    this.y += dy;
  }

  /**
   * Move to the first line of line,
   * and reset x coord to `0`.
   * [BUG]: It cannot go to row that above the screen
   */
  moveToLine(line: Line): void {
    this.resetX();
    this.moveY(-(this.y - line.y));
  }

  /**
   * Move to last line according to `this.yMax`.
   */
  moveToLastLine(): void {
    this.resetX();
    this.moveY(this.yMax - this.y);
  }

  /**
   * Clear current line.
   * @param dir see param `dir` in http://nodejs.org/api/tty.html#writestreamclearlinedir-callback
   */
  clearLine(dir: -1 | 0 | 1 = 0): void {
    stdout.clearLine(dir);
  }

  /**
   * Redraw the line.
   * @param line Line to redraw
   */
  redraw(line: Line): void {
    this.moveToLine(line);
    this.clearLine(0);
    this.output(line.render(), false);
    this.moveToLastLine();
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
}

export const ucon = new UCon();

export interface MidwareContext {
  next: () => string;
}

export type Midware = (ctx: MidwareContext) => string;

export interface RefMidware {
  line: Line;
  midware: number;
}

/**
 * Line.
 */
export class Line {
  constructor(y: number, first: InlineComponent<unknown>) {
    this.y = y;
    this.first = first;
  }

  /**
   * The y coord in terminal.
   */
  y: number;

  /**
   * The Midwares.
   */
  midwares: Midware[] = [(ctx) => ctx.next()];

  /**
   * The first InlineComponent
   */
  first: InlineComponent<unknown>;

  /**
   * Render this line.
   * @returns result text
   */
  render(): string {
    /**
     * Create the `next` in the context of `n`th midware
     * @param n index of midware
     * @returns `next` in the context of `n`th midware
     */
    const createNext = (n: number) => {
      if (n === this.midwares.length - 1) { // Last midware
        const first = this.first;
        return () => {
          return first.render();
        };
      } else {
        const nextMidware = this.midwares[n + 1];
        return function (this: MidwareContext) {
          this.next = createNext(n + 1);
          return nextMidware(this);
        };
      }
    };
    return this.midwares[0]({ next: createNext(0) });
  }
}

/**
 * The base class of all the components
 */
export abstract class Component<P> {
  constructor(props: P, con: UCon = ucon) {
    this.props = props;
    this.con = con;
  }

  /**
   * Properties.
   */
  readonly props: P;

  /**
   * UCon console.
   */
  readonly con: UCon;
}

/**
 * Block Component: 
 * Component that print several lines in the screen.
 * @example Such as `ProgressBar`
 */
export abstract class BlockComponent<P> extends Component<P> {

  /**
   * Lines of the output.
   */
  lines: Line[] = [];

  /**
   * Print to the screen.
   * **Only to be called once!**
   */
  mount(): void {
    const strs = this.render();
    for (const str of strs) {
      this.lines.push(this.con.log(str));
    }
  }

  /**
   * Redraw the line of `offsetLine`
   * @param offsetLine which line to redraw.
   */
  redraw(offsetLine = 0): void {
    this.lines[offsetLine].first = combiner([
      this.render()[offsetLine],
    ]);
    //If no proxy
    this.con.redraw(this.lines[offsetLine]);
  }

  /**
   * Render returns lines of text.
   * Wait for you to impl it.
   */
  abstract render(): string[];
}

/**
 * Container Component: 
 * Component that can process the log text.
 * @example Such as `GroupBox`
 */
export abstract class ContainerComponent<P> extends Component<P> {
  /**
   * Register to Console's Component Stack.
   */
  register(): void {
    this.con.stack.push(this);
  }  
  
  /**
  * Register itself
  */
  unregister(): void {
    if(this.con.stack.pop()!==this){
      // This happends when some ContainerComponent
      //   registered/unregistered incorrectly.
      throw new Error("Stack is not right!");
    }
  }

  /**
   * Called when a new line is created.
   * @param ref Ununsed
   * @returns This component's midware.
   */
  newLine(ref: RefMidware): Midware {
    return this.getMidware();
  }

  /**
   * Called when begin this Container.
   * Always calls `this.register`
   */
  abstract begin(): void;
  
  /**
   * Called when end this Container.
   * Always calls `this.unregister`
   */
  abstract end(): void;

  /**
   * @returns The midware.
   */
  abstract getMidware(): Midware;
}

/**
 * Inline Component: 
 * Component that decorates one line
 * @example Such as 'Combiner`,`Italitic`
 */
export abstract class InlineComponent<P> extends Component<P> {
  /**
   * Render returns the decorated text.
   * Wait for you to impl it.
   */
  abstract render(): string;
}

/**
 * The creator of a InlineComponent.
 * It works like a grammar sugar.
 */
export type InlineComponentCreator<P> = (props: P) => InlineComponent<P>;






/**
 * Combiner: A standard InlineComponent.
 * It combines several text/InlineComponents to one.
 */

export type CombinerProps = InlineComponent<unknown>[] | string[];
export class Combiner extends InlineComponent<CombinerProps> {
  render() {
    let result = "";
    for (const o of this.props) {
      if (typeof o === "string") {
        result += o;
      } else {
        result += o.render();
      }
    }
    return result;
  }
}
export const combiner: InlineComponentCreator<CombinerProps> = (props) => {
  return new Combiner(props);
};



/**
 * Combiner: A standard BlockComponent.
 * Shows a progress in the screen
 */

export interface ProgressBarProps {
  width: number;
  name: string;
}
export class ProgressBar extends BlockComponent<ProgressBarProps> {
  current = 0;
  render() {
    const nOKed = Math.round(this.current * this.props.width);
    return [
      this.props.name +
        ": [" +
        chalk.bgWhite(" ".repeat(nOKed)) +
        " ".repeat(this.props.width - nOKed) +
        "]" +
        chalk.yellow((this.current * 100).toFixed(1)) +
        "%",
    ];
  }
  progress(float: number): number {
    if (this.current + float > 1) {
      this.current = 1;
    } else {
      this.current += float;
    }
    this.redraw();
    return this.current;
  }
}
