import {
  ContentsProps,
  InlineComponent,
  BlankContents,
  ContentsArgs,
  combiner,
  CreateComponentAndInit,
  get_default_ucon,
} from "ucon";

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
export  function align(
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
  return CreateComponentAndInit(
    LeftAlign,
    { width, contents },
    get_default_ucon()
  );
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
  return CreateComponentAndInit(
    MiddleAlign,
    { width, contents },
    get_default_ucon()
  );
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
  return CreateComponentAndInit(
    RightAlign,
    { width, contents },
    get_default_ucon()
  );
}
////////////////////////////////////////////////////////////
