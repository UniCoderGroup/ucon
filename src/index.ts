import chalk from "chalk";
import { stdout } from "process";
import _ from "lodash";

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
    const currentLine = new Line(this.y, combiner(...objs));
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
   * In a terminal, some characters (such as Chinese characters) have 2 width,
   * while some may not display.
   * This function aimed to resolve the str to get the display width.
   * @returns The display length of str.
   */
  getStrDisplayWidth(str: string): number {
    return str.length;
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
      if (n === this.midwares.length - 1) {
        // Last midware
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

//type DefaultProps<OP> = {[K keyof OP]:K keyof Required<OP>?}

/**
 * The base class of all the components
 */
export abstract class Component<P> {
  constructor(props: P, con: UCon = ucon) {
    this.props = props;
    this.con = con;
  }

  /**
   * Defalt Properties.
   */
  defaultProps: P | undefined = undefined;

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
    this.lines[offsetLine].first = combiner(this.render()[offsetLine]);
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
    if (this.con.stack.pop() !== this) {
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
  abstract begin(...args:any): void;

  /**
   * Called when end this Container.
   * Always calls `this.unregister`
   */
  abstract end(...args:any): void;

  /**
   * @returns The midware.
   */
  abstract getMidware(): Midware;
}

/**
 * Inline Component:
 * Component that decorates one line
 * @example Such as `Combiner`,`Italitic`
 */
export abstract class InlineComponent<P> extends Component<P> {
  /**
   * Render returns the decorated text.
   * Wait for you to impl it.
   */
  abstract render(): string;
}

/**
 * This type receive InlineComponents or strings as contents of an InlineComponent.
 */
export type ContentsArgs = InlineComponent<unknown>[] | string[];

/**
 * This interface will be extended by an InlineComponent which receives contents.
 */
export interface ContentsProps {
  contents: ContentsArgs;
}

/**
 * This is the Blank value of ContentsProps.
 */
export const BlankContents: ContentsProps = {
  contents: [],
};

// [[Deprecated]]
// /**
//  * The creator of a InlineComponent.
//  * It works like a grammar sugar.
//  */
// export type InlineComponentCreator = (args: any) => InlineComponent<unknown>;

// Standard Components Region Begins.

///// Combiner /////////////////////////////////////////////
export interface CombinerProps extends ContentsProps { }
export class Combiner extends InlineComponent<CombinerProps> {
  render() {
    let result = "";
    for (const o of this.props.contents) {
      if (o instanceof InlineComponent) {
        result += o.render();
      } else {
        result += o as string;
      }
    }
    return result;
  }
}
/**
 * Combiner: A standard InlineComponent.
 * It combines several text/InlineComponents to one.
 */
export function combiner(...contents: ContentsArgs): Combiner {
  return new Combiner({ contents });
}
////////////////////////////////////////////////////////////

///// Align ////////////////////////////////////////////////
export type AlignDirection = "left" | "middle" | "right";
export interface AlignProps extends ContentsProps {
  width: number;
}
export abstract class Align extends InlineComponent<AlignProps> {
  defaultProps = {
    width: 10,
    ...BlankContents,
  };
}
/**
 * Align: A standard InlineComponent
 * It align a text to specific direction.
 */
export function align(
  direction: AlignDirection,
  width: number,
  ...contents: ContentsArgs
): Align {
  type Aligner<T extends Align> = (width: number, ...contents: ContentsArgs) => T;
  const aligner = new Map<
    AlignDirection,
    Aligner<LeftAlign | MiddleAlign | RightAlign>
  >([
    ["left", leftAlign],
    ["middle", middleAlign],
    ["right", rightAlign],
  ]).get(direction);
  if (aligner === undefined) {
    throw new Error("Unknown align direction!");
  }
  return aligner(width, ...contents);
}
////////////////////////////////////////////////////////////

///// LeftAlign ///////////////////////////////////////////
export class LeftAlign extends Align {
  render() {
    let str = combiner(...this.props.contents).render();
    let strWidth = this.con.getStrDisplayWidth(str);
    let leftMargin = this.props.width - strWidth;
    return str + " ".repeat(leftMargin);
  }
}
/**
 * LeftAlign: A standard InlineComponent
 * It align a text to left.
 */
export function leftAlign(width: number, ...contents: ContentsArgs): LeftAlign {
  return new LeftAlign({ width, contents });
}
////////////////////////////////////////////////////////////

///// MiddleAlign //////////////////////////////////////////
export class MiddleAlign extends Align {
  render() {
    let str = combiner(...this.props.contents).render();
    let strWidth = this.con.getStrDisplayWidth(str);
    let leftMargin = Math.floor((this.props.width - strWidth) / 2);
    let rightMargin = this.props.width - strWidth - leftMargin;
    return " ".repeat(leftMargin) + str + " ".repeat(rightMargin);
  }
}
/**
 * MiddleAlign: A standard InlineComponent
 * It align a text to middle.
 */
export function middleAlign(
  width: number,
  ...contents: ContentsArgs
): MiddleAlign {
  return new MiddleAlign({ width, contents });
}
////////////////////////////////////////////////////////////

///// RightAlign ///////////////////////////////////////////
export class RightAlign extends Align {
  render() {
    let str = combiner(...this.props.contents).render();
    let strWidth = this.con.getStrDisplayWidth(str);
    let rightMargin = this.props.width - strWidth;
    return " ".repeat(rightMargin) + str;
  }
}
/**
 * RightAlign: A standard InlineComponent
 * It align a text to right.
 */
export function rightAlign(
  width: number,
  ...contents: ContentsArgs
): RightAlign {
  return new RightAlign({ width, contents });
}
////////////////////////////////////////////////////////////

///// ChalkJs //////////////////////////////////////////////
export interface ChalkjsProps extends ContentsProps {
  chalk: chalk.Chalk;
}
export class Chalkjs extends InlineComponent<ChalkjsProps> {
  defaultProps = {
    chalk,
    ...BlankContents,
  };
  render() {
    return this.props.chalk(combiner(...this.props.contents).render());
  }
}
/**
 * Chalkjs: A standard InlineComponent
 * It calls chalk.js.
 */
export function chalkjs(
  chalk: chalk.Chalk,
  ...contents: ContentsArgs
): Chalkjs {
  return new Chalkjs({ chalk, contents });
}
////////////////////////////////////////////////////////////

///// Color ////////////////////////////////////////////////
export interface ColorProps extends ContentsProps {
  r: number;
  g: number;
  b: number;
}
export class Color extends InlineComponent<ColorProps> {
  defaultProps = {
    r: 0,
    g: 0,
    b: 0,
    ...BlankContents,
  };
  render() {
    return chalkjs(
      chalk.rgb(this.props.r, this.props.g, this.props.b),
      ...this.props.contents
    ).render();
  }
}
/**
 * Color: A standard InlineComponent
 * It uses chalk.js to add color to the content.
 */
export function color(
  r: number,
  g: number,
  b: number,
  ...contents: ContentsArgs
): Color {
  return new Color({ r, g, b, contents });
}
////////////////////////////////////////////////////////////

///// ProgressBar //////////////////////////////////////////
export interface ProgressBarProps {
  width: number;
  name: string;
  fractionDigits: number;
}
/**
 * ProgressBar: A standard BlockComponent.
 * Shows a progress in the screen
 */
export class ProgressBar extends BlockComponent<ProgressBarProps> {
  defaultProps = {
    width: 30,
    name: "Progress",
    fractionDigits: 1,
  };
  current = 0;
  render() {
    const nOKed = Math.round(this.current * this.props.width);
    return [
      this.props.name +
      ": [" +
      chalkjs(chalk.bgWhite, " ".repeat(nOKed)).render() +
      " ".repeat(this.props.width - nOKed) +
      "]" +
      chalkjs(
        chalk.yellow,
        rightAlign(this.props.fractionDigits + 4, (this.current * 100).toFixed(this.props.fractionDigits))
      ).render() +
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
////////////////////////////////////////////////////////////

///// Table ////////////////////////////////////////////////
export interface TableProps<T> {
  separator: boolean;
  title: string;
  cols: {
    title: string;
    width: number;
    align: AlignDirection;
    key: keyof T;
  }[];
}
/**
 * Table: A standard BlockComponent.
 * Shows a table in the screen.
 */
export class Table<T> extends BlockComponent<TableProps<T>> {
  defaultProps: TableProps<T> = {
    separator: true,
    title: "",
    cols: [],
  };
  // static charTable: {
  //   borders: [
  //     ["\u250F", "\u2501", "\u2513"],
  //     ["\u2503", "", "\u2503"],
  //     ["\u2517", "\u2501", "\u251B"]
  //   ],
  //   linkers:[
  //   ]
  // };
  datas: T[] = [];
  addData(...datas: T[]): void {
    this.datas.concat(datas);
  }
  render(): string[] {
    const titleLine = ()=>{
      return ".----- "+this.props.title+" -----."
    }
    const separateLine = () => {
      return this.props.separator ?
        ["+" + this.props.cols.map((col) => {
          return "-".repeat(col.width) + "+";
        }).join("")] : [];
    };
    const headerLine = () => {
      return ["|" +
        this.props.cols.map((col) => {
          return align(col.align, col.width, col.title).render() + "|";
        }).join("")];
    };
    const dataLine = (data: T) => {
      return ["|" +
        this.props.cols.map((col) => {
          let str = new String(data[col.key]);
          return align(col.align, col.width, str as string).render() + "|";
        }).join("")];
    }
    const datasLines = () => {
      let result: string[] = [];
      this.datas.forEach((data) => {
        result = result.concat(
          dataLine(data)
        );
      });
      return result;
    }
    return (
      (new Array<string>()).concat(
        titleLine(),
        separateLine(),
        headerLine(),
        separateLine(),
        datasLines(),
        separateLine()
      )
    );
  }
}
////////////////////////////////////////////////////////////

///// GroupBox /////////////////////////////////////////////
export interface GroupBoxProps{
  
}
export class GroupBox extends ContainerComponent<GroupBoxProps>{
  begin(title:string){
    this.con.log(".- "+title);
    this.register();
  }
  getMidware(){
    return (ctx: MidwareContext)=>{
      return "+"+ctx.next();
    }
  }
  end(){
    this.unregister();
    this.con.log("`-----");
  }
}
////////////////////////////////////////////////////////////