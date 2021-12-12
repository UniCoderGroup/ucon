import UTty from "./utty"
import chalk from "chalk";
import _ from "lodash";
import { runInThisContext } from "node:vm";

type ContainerStack = ContainerComponent[];

// export interface IOCon {
//   stack: ContainerStack;
//   get lineNum(): number;
//   log: (...objs: ContentsArgs) => Line;
//   redraw: (line: Line) => void;
//   insertLine: (y: number, line: Line) => void;
//   deleteLine: (line: Line) => void;
//   getStrDisplayWidth: (str: string) => number;
// }

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

  /**
   * Insert a line.
   */
  insertLine(y: number, line: Line): void {
    this.lines.push(this.lines[this.lines.length - 1]);
    for (let i = this.lines.length - 1; i > y; i--) {
      this.lines[i] = this.lines[i - 1];
      this.lines[i].y++;
      this.redraw(this.lines[i]);
    }
    this.tty.moveY(-1);
    this.tty.clearLine(0);
    this.tty.moveToLastLine();
    this.lines[y] = line;
    line.y = y;
    this.redraw(line);
  }

  /**
   * Delete a line.
   */
  deleteLine(line: Line = this.lines[this.lines.length - 1]): void {
    if (this.lines[line.y] !== line) {
      throw new Error("This line has already been detached!");
    }
    for (let i = line.y + 1; i < this.lines.length; i++) {
      this.lines[i - 1] = this.lines[i];
      this.lines[i - 1].y--;
      this.redraw(this.lines[i - 1]);
    }
    this.lines.pop();
    this.tty.moveY(-1);
    this.tty.clearLine(0);
  }

  /**
   * Add a line in the end of lines.
   */
  addLine(content: InlineComponent): Line {
    const currentLine = createLine(this.stack, content);
    currentLine.y = this.tty.y;
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
  constructor(y: number, content: InlineComponent) {
    this.y = y;
    this.content = content;
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
  content: InlineComponent;

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
        const first = this.content;
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
 * Create line.
 */
function createLine(stack: ContainerStack, content: InlineComponent): Line {
  const line = new Line(-1, content);
  for (const compo of stack) {
    line.midwares.push(
      compo.newLine({
        line: line,
        midware: line.midwares.length,
      })
    );
  }
  return line;
}

/**
 * The base class of all the components
 */
export abstract class Component<P, C> {
  constructor(props: P, con: C) {
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
  readonly con: C;
}

/**
 * Block Component:
 * Component that print several lines in the screen.
 * @example Such as `ProgressBar`
 */
export abstract class BlockComponent<P = unknown> extends Component<P, ConForBlock> {
  constructor(props: P, con: ConForBlock = ucon) {
    super(props, con);
  }

  /**
   * Lines of the output.
   */
  lines: Line[] = [];

  /**
   * Is this component mounted.
   */
  mounted = false;

  /**
   * Print to the screen.
   */
  mount(): void {
    this.mounted = true;
    const strs = this.render();
    for (const str of strs) {
      this.lines.push(
        this.con.addLine(inlStr(str)
        ));
    }
  }

  unmount(): void {
    if (!this.mounted) throw new Error("Cannot unmount unmounted component!");
    for (let line of this.lines) {
      this.con.deleteLine(line);
    }
    this.mounted = false;
  }

  /**
   * Redraw the line of `offsetLine`
   * @param offsetLine which line to redraw.
   */
  redraw(offsetLine = 0): void {
    this.lines[offsetLine].content = combiner(this.render()[offsetLine]);
    //If no proxy
    this.con.redraw(this.lines[offsetLine]);
  }

  /**
   * Redraw all lines.
   */
  redrawAll(): void {
    let strs = this.render();
    for (let i in strs) {
      this.lines[i].content = combiner(strs[i]);
      //If no proxy
      this.con.redraw(this.lines[i]);
    }
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
export abstract class ContainerComponent<P = unknown> extends Component<P, ConForContainer> {
  constructor(props: P, con: ConForContainer = ucon) {
    super(props, con);
  }

  /**
   * Register to Console's Component Stack.
   */
  register(): void {
    this.con.registerContainer(this);
  }

  /**
   * Register itself
   */
  unregister(): void {
    this.con.unregisterContainer(this);
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
  abstract begin(...args: any): void;

  /**
   * Called when end this Container.
   * Always calls `this.unregister`
   */
  abstract end(...args: any): void;

  /**
   * @returns The midware.
   */
  abstract getMidware(): Midware;

  log = this.con.log.bind(this.con);
}

/**
 * Inline Component:
 * Component that decorates one line
 * @example Such as `Combiner`,`Italitic`
 */
export abstract class InlineComponent<P = unknown> extends Component<P, ConForInline> {
  constructor(props: P, con: ConForInline = ucon) {
    super(props, con);
  }

  /**
   * Render returns the decorated text.
   * Wait for you to impl it.
   */
  abstract render(): string;
}

/**
 * This type receive InlineComponents or strings as contents of an InlineComponent.
 */
export type ContentsArgs = (InlineComponent | string)[];

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
// export type InlineComponentCreator = (args: any) => InlineComponent;

// Standard Components Region Begins.

///// InlStr ///////////////////////////////////////////////
export type InlStrProps = string;
export class InlStr extends InlineComponent<InlStrProps> {
  render() {
    return this.props;
  }
}
/**
 * InlStr: A standard InlineComponent.
 * It converts string to InlineComponent.
 */
export function inlStr(str: string): InlStr {
  return new InlStr(str);
}
////////////////////////////////////////////////////////////

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

///// Symbol ///////////////////////////////////////////////
export type SymbolIconNames = "tick" | "alert" | "cross" | "info";
export interface SymbolIconProps {
  name: SymbolIconNames;
}
export class SymbolIcon extends InlineComponent<SymbolIconProps>{
  SymbolCharTable = new Map<SymbolIconNames, string>([
    ["tick", "\u2714"],
    ["alert", "\u26A0"],
    ["cross", "\u274C"],
    ["info", "\u2139"]
  ]);
  render() {
    let iconStr = this.SymbolCharTable.get(this.props.name);
    if (iconStr === undefined) {
      throw new Error(this.props.name + " is not an icon!");
    }
    return iconStr;
  }
}
/**
 * Symbol: A standard InlineComponent.
 * It shows a symbol in terminal.
 * @param name Name of the symbol.
 */
export function symbolIcon(name: SymbolIconNames) {
  return new SymbolIcon({ name });
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
    let strWidth = this.con.tty.getStrDisplayWidth(str);
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
    let strWidth = this.con.tty.getStrDisplayWidth(str);
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
    let strWidth = this.con.tty.getStrDisplayWidth(str);
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

///// Composition //////////////////////////////////////////

////////////////////////////////////////////////////////////

///// Switcher /////////////////////////////////////////////
// TODO
class SwitcherFakeCon implements ConForBlock {
  constructor(con: ConForBlock) {
    this.con = con;
    this.stack = _.clone(con.stack);
    this.startY = con.lineNum;
    this.tty = this.con.tty;
  }
  con: ConForBlock;
  stack: ContainerStack;
  startY: number;
  lines: Line[] = [];
  tty: UTty;
  get lineNum() {
    return this.startY + this.lines.length;
  }
  redraw(line: Line): void {
    this.con.redraw(this.lines[line.y]);
  }
  insertLine(y: number, line: Line): void {
    this.lines.push(this.lines[this.lines.length - 1]);
    for (let i = this.lines.length - 1; i > y; i--) {
      this.lines[i] = this.lines[i - 1];
      this.lines[i].y++;
    }
    this.tty.moveY(-1);
    this.tty.clearLine(0);
    this.tty.moveToLastLine();
    this.lines[y] = line;
    line.y = y;
    this.con.insertLine(this.startY + y, line);
  }
  deleteLine(line: Line = this.lines[this.lines.length - 1]): void {
    if (this.lines[line.y] !== line) {
      throw new Error("This line has already been detached!");
    }
    for (let i = line.y + 1; i < this.lines.length; i++) {
      this.lines[i - 1] = this.lines[i];
      this.lines[i - 1].y--;
      this.redraw(this.lines[i - 1]);
    }
    this.con.deleteLine(this.startY + line.y);
  }
  addLine(content: InlineComponent): Line {
    const currentLine = createLine(this.stack, content);
    currentLine.y = this.lineNum;
    this.lines.push(currentLine);
    this.con.insertLine(this.startY + this.lineNum, currentLine);
    return currentLine;
  }
}

/**
 * #####
 * 12.12记录：FakeCon应总是提供FakeLine。
 * #####
 */


type BlockComponentConstructor<C extends BlockComponent<P>, P> = new (porps: P, con?: ConForBlock) => C;
export interface SwitcherProps<
  C1 extends BlockComponent<P1>, P1,
  C2 extends BlockComponent<P2>, P2> {
  prop1: P1;
  ctor1: BlockComponentConstructor<C1, P1>;
  prop2: P2;
  ctor2: BlockComponentConstructor<C2, P2>;
}
type SwitcherState = 0 | 1 | 2;
/**
 * Switcher: A standard BlockComponent.
 * Switch two BlockComponents.
 */
export class Switcher<
  C1 extends BlockComponent<P1>, P1,
  C2 extends BlockComponent<P2>, P2
  > extends BlockComponent<SwitcherProps<C1, P1, C2, P2>>{
  stack: ContainerStack = [];
  fakeCon: ConForBlock | undefined = undefined;
  state: SwitcherState = 0;
  comp1: C1 | undefined = undefined;
  comp2: C2 | undefined = undefined;
  mount(state: SwitcherState = 0) {
    this.mounted = true;
    this.fakeCon = new SwitcherFakeCon(this.con);
    this.comp1 = new this.props.ctor1(this.props.prop1, this.fakeCon);
    this.comp2 = new this.props.ctor2(this.props.prop2, this.fakeCon);
    this.switch(state);
    this.stack = _.clone(this.con.stack);
    if (this.state !== 0) {
      this.getComp(this.state)!.mount();
      this.lines = this.getComp(this.state)!.lines;
    }
  }
  unmount() {
    if (!this.mounted) throw new Error("Cannot unmount unmounted component!");
    if (this.state !== 0) {
      this.getComp(this.state)!.unmount();
    }
    this.lines = [];
    this.mounted = false;
  }
  render() {
    if (!this.mounted) return [];
    switch (this.state) {
      case 0:
        return [];
      case 1:
        return this.comp1!.render();
      case 2:
        return this.comp2!.render();
      default:
        throw new Error("Unknown switcher state!");
    }
  }
  clear(): void {
    this.switch(0);
  }
  getComp(id: SwitcherState): C1 | C2 | undefined {
    switch (id) {
      case 1:
        return this.comp1;
      case 2:
        return this.comp2;
      default:
        return undefined;
    }
  }
  switch(to: SwitcherState): void {
    if (this.mounted) {
      let unmount = false;
      let mount = false;
      if (to !== this.state) {
        if (this.state !== 0) {
          unmount = true;
        }
        if (to !== 0) {
          mount = true;
        }
      }
      if (unmount) {
        if (this.state === 0) {
          throw new Error("Switcher Logical error!");
        }
        this.getComp(this.state)!.unmount();
      }
      if (mount) {
        if (to === 0) {
          throw new Error("Switcher Logical error!");
        }
        this.getComp(to)!.mount();
      }
    }
    this.state = to;
    this.lines = this.state === 0 ? [] : this.getComp(this.state)!.lines;
  }
}
////////////////////////////////////////////////////////////

///// Text /////////////////////////////////////////////////
export type TextProp = string;
/**
 * Text: A standard BlockComponent.
 * Shows lines of text in the screen.
 */
export class Text extends BlockComponent<TextProp>{
  render() {
    let result = [""]
    for (let c of this.props) {
      if (c === "\n") {
        result.push("");
      } else {
        result[result.length - 1] += c;
      }
    }
    return result;
  }
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
 * Shows a progress in the screen.
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
    const titleLine = () => {
      return ".----- " + this.props.title + " -----."
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
export interface GroupBoxProps {

}
export class GroupBox extends ContainerComponent<GroupBoxProps>{
  begin(...title: ContentsArgs) {
    this.con.addLine(combiner("\u256D\u2574", chalkjs(chalk.bold, ...title)));
    this.register();
  }
  getMidware() {
    return function (ctx: MidwareContext) {
      return "\u2502  " + ctx.next();
    }
  }
  end() {
    this.unregister();
    this.con.addLine(inlStr("\u2570\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500"));
  }
  /**
   * Show a section.
   */
  sect(...contents: ContentsArgs): void {
    this.unregister();
    this.con.addLine(combiner("\u251C\u2574", ...contents));
    this.register();
  }
  /**
   * Show a step.
   */
  step(...contents: ContentsArgs): void {
    this.unregister();
    this.con.addLine(combiner("\u2502\u2576 ", ...contents));
    this.register();
  }
}
////////////////////////////////////////////////////////////