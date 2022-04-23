import { ContainerComponent } from "./component.js";
import { ConForBlock, ContainerStack } from "./ucon.js";
import {
  CreateComponentAndInit,
  BlockComponent,
  ComponentConstructor,
  InlineComponent,
  ComponentP,
  ComponentC,
} from "./component.js";
import { MidwareContext, createLine, Line, Midware } from "./line.js";
import UTty, { LineContext } from "utty";
import chalk, { ChalkInstance } from "chalk";
import { BlankContents, ContentsArgs, ContentsProps } from "./global.js";
import {get_default_ucon} from "./index.js";
import _ from "lodash";

///// GroupBox /////////////////////////////////////////////
//eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface GroupBoxProps {}
export type GroupBoxBeginArgs = [...title: ContentsArgs];
export type GroupBoxEndArgs = [];
export class GroupBox extends ContainerComponent<
  GroupBoxProps,
  GroupBoxBeginArgs,
  GroupBoxEndArgs
> {
  begin(...args: GroupBoxBeginArgs) {
    this.init();
    this.con.addLine(combiner("\u256D\u2574", chalkjs(chalk.bold, ...args)));
    this.register();
    let x = args[0];
  }
  getMidware(): Midware {
    return function (ctx: MidwareContext) {
      const next = ctx.next();
      return ["\u2502  " + next[0], next[1]];
    };
  }
  end(..._args: GroupBoxEndArgs) {
    this.unregister();
    this.con.addLine(
      inlStr(
        "\u2570\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500"
      )
    );
  }
  /**
   * Show a section.
   */
  sect(...contents: ContentsArgs): void {
    this.unregister();
    this.con.addLine(combiner("\u251C\u2574", ...contents, ">"));
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

///// Composition //////////////////////////////////////////

////////////////////////////////////////////////////////////

///// Switcher /////////////////////////////////////////////
class SwitcherFakeLine implements Line {
  constructor(realLine: Line) {
    this.realLine = realLine;
  }
  realLine: Line;
  y = -1;
  get content(): InlineComponent {
    return this.realLine.content;
  }
  set content(content: InlineComponent) {
    this.realLine.content = content;
  }
  get midwares(): Midware[] {
    return this.realLine.midwares;
  }
  render(additionalContext?: LineContext): [string, LineContext] {
    return this.realLine.render(additionalContext);
  }
}
interface SwitcherLine {
  real: Line;
  fake: SwitcherFakeLine;
}
function createSwitcherLine(
  stack: ContainerStack,
  content: InlineComponent
): SwitcherLine {
  let real = createLine(stack, content);
  return {
    real: real,
    fake: new SwitcherFakeLine(real),
  };
}
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
  lines: SwitcherLine[] = [];
  tty: UTty;
  get lineNum() {
    return this.lines.length;
  }
  redraw(line: Line): void {
    this.con.redraw(this.lines[line.y].fake);
  }
  insertLine(y: number, line: Line): void {
    this.lines.push(this.lines[this.lines.length - 1]);
    for (let i = this.lines.length - 1; i > y; i--) {
      this.lines[i] = this.lines[i - 1];
      this.lines[i].real.y++;
    }
    this.lines[y] = createSwitcherLine(this.stack, line.content);
    this.lines[y].real.y = y;
    this.con.insertLine(this.startY + y, this.lines[y].fake);
  }
  deleteLine(line: Line): void {
    if (this.lines[line.y].real !== line) {
      throw new Error("This line has already been detached!");
    }
    for (let i = line.y + 1; i < this.lines.length; i++) {
      this.lines[i - 1] = this.lines[i];
      this.lines[i - 1].real.y--;
    }
    this.con.deleteLine(this.lines[line.y].fake);
    this.lines.pop();
  }
  addLine(content: InlineComponent): Line {
    const currentLine = createSwitcherLine(this.stack, content);
    currentLine.real.y = this.lineNum;
    this.con.insertLine(this.startY + this.lineNum, currentLine.fake);
    this.lines.push(currentLine);
    return currentLine.real;
  }
}
export interface SwitcherProps<
  C1 extends BlockComponent,
  C2 extends BlockComponent
> {
  prop1: ComponentP<C1>;
  ctor1: ComponentConstructor<C1>;
  prop2: ComponentP<C2>;
  ctor2: ComponentConstructor<C2>;
}
type SwitcherState = 0 | 1 | 2;
/**
 * Switcher: A standard BlockComponent.
 * Switch two BlockComponents.
 */
export class Switcher<
  C1 extends BlockComponent,
  C2 extends BlockComponent
> extends BlockComponent<SwitcherProps<C1, C2>> {
  fakeCon: ConForBlock | undefined = undefined;
  state: SwitcherState = 0;
  comp1: C1 | undefined = undefined;
  comp2: C2 | undefined = undefined;
  mount(state: SwitcherState = 0) {
    this.mounted = true;
    this.fakeCon = new SwitcherFakeCon(this.con);
    this.comp1 = new this.props.ctor1(
      this.props.prop1,
      this.fakeCon /*[*/ as ComponentC<C1> /*]*/
    ); // See https://github.com/microsoft/TypeScript/issues/47745
    this.comp2 = new this.props.ctor2(
      this.props.prop2,
      this.fakeCon /*[*/ as ComponentC<C2> /*]*/
    );
    this.switch(state);
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
  switch(to: SwitcherState /*, reconstruct:boolean = false*/): void {
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
export type TextProps = ContentsArgs;
/**
 * Text: A standard BlockComponent.
 * Shows lines of text in the screen.
 */
export class Text extends BlockComponent<TextProps> {
  render() {
    let result = [""];
    for (let c of combiner(...this.props).render()) {
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
          rightAlign(
            this.props.fractionDigits + 4,
            (this.current * 100).toFixed(this.props.fractionDigits)
          )
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
      return ".----- " + this.props.title + " -----.";
    };
    const separateLine = () => {
      return this.props.separator
        ? [
            "+" +
              this.props.cols
                .map((col) => {
                  return "-".repeat(col.width) + "+";
                })
                .join(""),
          ]
        : [];
    };
    const headerLine = () => {
      return [
        "|" +
          this.props.cols
            .map((col) => {
              return align(col.align, col.width, col.title).render() + "|";
            })
            .join(""),
      ];
    };
    const dataLine = (data: T) => {
      return [
        "|" +
          this.props.cols
            .map((col) => {
              let str = _.toString(data[col.key]);
              return align(col.align, col.width, str as string).render() + "|";
            })
            .join(""),
      ];
    };
    const datasLines = () => {
      let result: string[] = [];
      this.datas.forEach((data) => {
        result = result.concat(dataLine(data));
      });
      return result;
    };
    return new Array<string>().concat(
      titleLine(),
      separateLine(),
      headerLine(),
      separateLine(),
      datasLines(),
      separateLine()
    );
  }
}
////////////////////////////////////////////////////////////

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
  return CreateComponentAndInit(InlStr, str, get_default_ucon());
}
////////////////////////////////////////////////////////////

///// Combiner /////////////////////////////////////////////
export type CombinerProps = ContentsProps;
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
  return CreateComponentAndInit(Combiner, { contents }, get_default_ucon());
}
////////////////////////////////////////////////////////////

///// Symbol ///////////////////////////////////////////////
export type SymbolIconNames = "tick" | "alert" | "cross" | "info";
export interface SymbolIconProps {
  name: SymbolIconNames;
}
export class SymbolIcon extends InlineComponent<SymbolIconProps> {
  SymbolCharTable = new Map<SymbolIconNames, string>([
    ["tick", "\u2714"],
    ["alert", "\u26A0"],
    ["cross", "\u274C"],
    ["info", "\u2139"],
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
  return CreateComponentAndInit(SymbolIcon, { name }, get_default_ucon());
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
  type Aligner<T extends Align> = (
    width: number,
    ...contents: ContentsArgs
  ) => T;
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
  return CreateComponentAndInit(LeftAlign, { width, contents }, get_default_ucon());
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
  return CreateComponentAndInit(MiddleAlign, { width, contents }, get_default_ucon());
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
  return CreateComponentAndInit(RightAlign, { width, contents }, get_default_ucon());
}
////////////////////////////////////////////////////////////

///// ChalkJs //////////////////////////////////////////////
export interface ChalkjsProps extends ContentsProps {
  chalk: ChalkInstance;
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
  chalk: ChalkInstance,
  ...contents: ContentsArgs
): Chalkjs {
  return CreateComponentAndInit(Chalkjs, { chalk, contents }, get_default_ucon());
}
////////////////////////////////////////////////////////////
