import { ConForBlock, ContainerStack } from "./ucon.js";
import {
  CreateComponentAndInit,
  BlockComponent,
  ComponentConstructor,
  InlineComponent,
  ComponentP,
  ComponentC,
} from "./component.js";
import { createLine, Line, Midware } from "./line.js";
import {
  ContentsArgs,
  ContentsProps,
  RenderedLine,
  combineRenderedLines,
} from "./global.js";
import { get_default_ucon } from "./index.js";
import UTty, { LineContext } from "utty";
import _ from "lodash";

///// Composition //////////////////////////////////////////
export interface CompositionProps<Components extends BlockComponent[]> {
  components: Components;
}
export abstract class Composition<
  Components extends BlockComponent[] = BlockComponent[]
> extends BlockComponent<CompositionProps<Components>> {}
export class CompositionH<
  Components extends BlockComponent[]
> extends Composition<Components> {
  render() {
    let result: RenderedLine[] = [];
    for (const c of this.props.components) {
      let lines = c.render();
      for (let i = 0; i < lines.length; i++) {
        if (i === result.length) {
          result.push(lines[i]);
        } else {
          result[i] = combineRenderedLines(result[i], lines[i]);
        }
      }
    }
    return result;
  }
}
class CompositionVFakeLine implements Line {
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
interface CompositionVLine {
  real: Line;
  fake: SwitcherFakeLine;
}
function createCompositionVLine(
  stack: ContainerStack,
  content: InlineComponent
): CompositionVLine {
  let real = createLine(stack, content);
  return {
    real: real,
    fake: new CompositionVFakeLine(real),
  };
}
class CompositionVFakeCon implements ConForBlock {
  constructor(con: ConForBlock) {
    this.con = con;
    this.stack = _.clone(con.stack);
    this.startY = con.lineNum;
    this.tty = this.con.tty;
  }
  con: ConForBlock;
  stack: ContainerStack;
  startY: number;
  lines: CompositionVLine[] = [];
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
    this.lines[y] = createCompositionVLine(this.stack, line.content);
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
export class CompositionV<
  Components extends BlockComponent[]
> extends Composition<Components> {
  constructor(
    props: CompositionProps<Components>,
    con: ConForBlock = get_default_ucon()
  ) {
    super(props, con);
    this.fakeCon = new CompositionVFakeCon(this.con);
  }
  fakeCon: CompositionVFakeCon;
  mount() {
    super.mount();
    for (const c of this.props.components) {
      c.con = this.fakeCon;
      c.mount();
    }
  }
  render() {
    return this.props.components.flatMap((v) => v.render());
  }
}
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
        this.getComp(this.state)!.unmount();
      }
      if (mount) {
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
    for (const c of combiner(...this.props).render()) {
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
