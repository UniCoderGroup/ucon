import chalk from "chalk";
import { InlineComponent } from "../component";
import { BlankContents, ContentsArgs, ContentsProps } from "../global";

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
export type CombinerProps = ContentsProps
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
