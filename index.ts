import chalk from "chalk";
import readline from "readline";
import { stdin, stdout } from "process";
const rl = readline.createInterface({
  input: stdin,
  output: stdout,
});

export class UCon {
  y = 0;
  lines: Line[] = [];
  stack: ContainerComponent<unknown>[] = [];
  async log(...objs: InlineComponent<unknown>[] | string[]): Promise<number> {
    const currentLine = new Line(combiner(objs));
    for (const c of this.stack) {
      currentLine.midwares.push(
        c.newLine({
          line: this.lines.length,
          midware: currentLine.midwares.length,
        })
      );
    }
    this.lines.push(currentLine);
    rl.write((await currentLine.render()) + "\n");
    this.y++;
    return this.lines.length - 1;
  }
  async redraw(nLine: number): Promise<void> {
    const len = this.lines.length;
    stdout.cursorTo(0);
    stdout.moveCursor(0, -(len - nLine));
    this.y -= len - nLine;
    stdout.clearLine(0);
    stdout.write(await this.lines[nLine].render());
    stdout.cursorTo(0);
    stdout.moveCursor(0, len - nLine);
    this.y += len - nLine;
  }
  getMidware(ref: RefMidware): Midware {
    //Add Asserts
    return this.lines[ref.line].midwares[ref.midware];
  }
  async setMidware(ref: RefMidware, newOne: Midware): Promise<void> {
    //Add Asserts
    this.lines[ref.line].midwares[ref.midware] = newOne;
    await this.redraw(ref.line);
  }
}
export const ucon = new UCon();
export interface Context {
  next: () => Promise<string>;
}
export type Midware = (ctx: Context) => Promise<string>;
export interface RefMidware {
  line: number;
  midware: number;
}
export class Line {
  constructor(first: InlineComponent<unknown>) {
    this.first = first;
  }
  midwares: Midware[] = [async (ctx) => await ctx.next()];
  first: InlineComponent<unknown>;
  async render(): Promise<string> {
    const createNext = (n: number) => {
      if (n === this.midwares.length - 1) {
        const first = this.first;
        return async () => {
          return await first.render();
        };
      } else {
        const nextMidware = this.midwares[n + 1];
        return async function (this: Context) {
          this.next = createNext(n + 1);
          return await nextMidware(this);
        };
      }
    };
    return await this.midwares[0]({ next: createNext(0) });
  }
}
export abstract class Component<P> {
  constructor(props: P, con: UCon = ucon) {
    this.props = props;
    this.con = con;
  }
  props: P;
  con: UCon;
}
export abstract class BlockComponent<P> extends Component<P> {
  firstLine = -1;
  async mount(): Promise<void> {
    this.firstLine=this.con.lines.length;
    const strs = await this.render();
    for (const str of strs) {
      await this.con.log(str);
    }
  }
  async redraw(offsetLine = 0): Promise<void> {
    this.con.lines[this.firstLine + offsetLine].first = combiner([
      (await this.render())[offsetLine],
    ]);
    //If no proxy
    await this.con.redraw(this.firstLine + offsetLine);
  }
  abstract render(): Promise<string[]>;
}
export abstract class ContainerComponent<P> extends Component<P> {
  register(): void {
    this.con.stack.push(this);
  }
  unregister(): void {
    this.con.stack.pop();
  }
  newLine(ref: RefMidware): Midware {
    return this.getMidware();
  }
  abstract begin(): void;
  abstract end(): void;
  abstract getMidware(): Midware;
}
export abstract class InlineComponent<P> extends Component<P> {
  abstract render(): Promise<string>;
}
export type InlineComponentCreator<P> = (props: P) => InlineComponent<P>;

export type CombinerProps = InlineComponent<unknown>[] | string[];
export class Combiner extends InlineComponent<CombinerProps> {
  async render() {
    let result = "";
    for (const o of this.props) {
      if (typeof o === "string") {
        result += o;
      } else {
        result += await o.render();
      }
    }
    return result;
  }
}
export const combiner: InlineComponentCreator<CombinerProps> = (props) => {
  return new Combiner(props);
};

export interface ProgressBarProps {
  width: number;
  name: string;
}
export class ProgressBar extends BlockComponent<ProgressBarProps> {
  current = 0;
  async render() {
    const nOKed = Math.round(this.current * this.props.width);
    return [
      this.props.name +
        ": [" +
        chalk.bgWhite(" ".repeat(nOKed)) +
        " ".repeat(this.props.width - nOKed) +
        "]" +
        (this.current * 100).toFixed(1) +
        "%",
    ];
  }
  async progress(float: number): Promise<number> {
    if (this.current + float > 1) {
      this.current = 1;
    } else {
      this.current += float;
    }
    await this.redraw();
    return this.current;
  }
}
