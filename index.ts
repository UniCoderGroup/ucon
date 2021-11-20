import chalk from 'chalk'
import readline from 'readline'
import { stdin, stdout } from 'process'
const rl = readline.createInterface({
    input: stdin,
    output: stdout
});

class UCon {
    lines: Line[] = [];
    stack: ContainerComponent<unknown>[] = [];
    async log(...objs: InlineComponent<unknown>[] | string[]): Promise<number> {
        let currentLine = new Line(combiner(objs));
        for (let c of this.stack) {
            currentLine.midwares.push(
                c.newLine({
                    line: this.lines.length,
                    midware: currentLine.midwares.length
                })
            );
        }
        this.lines.push(currentLine);

        rl.write(await currentLine.render() + "\n");
        return this.lines.length - 1;
    }
    async redraw(nLine: number): Promise<void> {
        const len = this.lines.length;
        rl.write("\n");
        readline.moveCursor(stdout, 0, -(1 + len - nLine));
        for (let n = nLine; n < len; n++) {
            rl.write(await this.lines[n].render() + "\n");
        }
    }
    getMidware(ref: RefMidware): Midware {
        //Add Asserts
        return this.lines[ref.line]
            .midwares[ref.midware];
    }
    setMidware(ref: RefMidware, newOne: Midware): void {
        //Add Asserts
        this.lines[ref.line]
            .midwares[ref.midware] = newOne;
        this.redraw(ref.line);
    }
}
var ucon = new UCon;
interface Context {
    next: () => Promise<string>
}
type Midware = (ctx: Context) => Promise<string>;
interface RefMidware {
    line: number,
    midware: number
}
class Line {
    constructor(first: InlineComponent<unknown>) {
        this.first = first;
    }
    midwares: Midware[] = [async ctx => await ctx.next()];
    first: InlineComponent<unknown>;
    async render(): Promise<string> {
        let createNext = (n: number) => {
            if (n === this.midwares.length - 1) {
                let first = this.first;
                return async () => {
                    return await first.render();
                }
            } else {
                let nextMidware = this.midwares[n + 1];
                return async function (this: Context) {
                    this.next = createNext(n + 1);
                    return await nextMidware(this);
                }
            }
        }
        return await this.midwares[0]({ next: createNext(0) });
    }
}
abstract class Component<P>{
    constructor(props: P, con: UCon = ucon) {
        this.props = props;
        this.con = con;
    }
    props: P;
    con: UCon;
}
abstract class BlockComponent<P> extends Component<P>{
    firstLine: number = -1;
    async mount(): Promise<void> {
        let strs = await this.render();
        for (const str of strs) {
            this.firstLine = await this.con.log(str);
        }
        this.firstLine -= strs.length - 1;
    }
    async redraw(offsetLine: number = 0): Promise<void> {
        this.con.lines[this.firstLine + offsetLine]
            .first = combiner([(await this.render())[offsetLine]]);
        //If no proxy
        this.con.redraw(this.firstLine + offsetLine);
    }
    abstract render(): Promise<string[]>;
}
abstract class ContainerComponent<P> extends Component<P>{
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
abstract class InlineComponent<P> extends Component<P>{
    abstract render(): Promise<string>;
}
type InlineComponentCreator<P> = (props: P) => InlineComponent<P>

type CombinerProps = InlineComponent<unknown>[] | string[];
class Combiner extends InlineComponent<CombinerProps>{
    async render() {
        let result = "";
        for (const o of this.props) {
            if (typeof o === 'string') {
                result += o;
            } else {
                result += await o.render();
            }
        }
        return result;
    }
}
const combiner: InlineComponentCreator<CombinerProps> = props => {
    return new Combiner(props);
}

interface ProgressBarProps {
    width: number;
    name: string;
}
class ProgressBar extends BlockComponent<ProgressBarProps>{
    current: number = 0;
    async render() {
        let nOKed = Math.round(this.current * this.props.width);
        return [this.props.name
            + ": ["
            + chalk.bgWhite(" ".repeat(nOKed))
            + " ".repeat(this.props.width - nOKed)
            + "]"
            + (this.current * 100).toFixed(1)
            + "%"];
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

// Test Begin

let p1 = new ProgressBar({ width: 20, name: "Processing1" });
let p2 = new ProgressBar({ width: 20, name: "Processing2" });
p1.mount();
p2.mount();
setInterval(() => { p1.progress(0.1); p2.progress(0.05) }, 1000);