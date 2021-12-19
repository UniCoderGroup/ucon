import { ConForBlock, ContainerStack } from "../ucon";
import { BlockComponent, BlockComponentConstructor, InlineComponent } from "../component";
import { createLine, Line, Midware } from "../line";
import UTty from "utty";
import { align, AlignDirection, chalkjs, combiner, rightAlign } from "./inline";
import chalk from "chalk";
import { ContentsArgs } from "../global";
import _ from "lodash";

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
    render<AC extends Object>(additionalContext?: AC): string {
        return this.realLine.render(additionalContext);
    }
}
interface SwitcherLine {
    real: Line;
    fake: SwitcherFakeLine;
}
function createSwitcherLine(stack: ContainerStack, content: InlineComponent): SwitcherLine {
    let real = createLine(stack, content);
    return {
        real: real,
        fake: new SwitcherFakeLine(real)
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
        this.lines[y] = createSwitcherLine(this.stack, line.content);;
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
export type TextProp = ContentsArgs;
/**
 * Text: A standard BlockComponent.
 * Shows lines of text in the screen.
 */
export class Text extends BlockComponent<TextProp>{
    render() {
        let result = [""]
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
