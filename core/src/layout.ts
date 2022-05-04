export interface Layout {
  calcMinWidth(): number;
  calcMaxWidth(): number;
  applyWidth(left: number): number;
}
export class DivLayout implements Layout {
  constructor(layoutStyle: LayoutStyle, children: Layout[]) {
    this.layoutStyle = layoutStyle;
    this.children = children;
  }
  layoutStyle: LayoutStyle;
  children: Layout[];
  calcChildrenWidthMin(): number {
    let result = 0;
    for (const p of this.children) {
      result += p.calcMinWidth();
    }
    return result;
  }
  addPaddingWidth(children: number): number {
    return (
      this.layoutStyle.padding[LayoutStyleTypes.Direction.Left] +
      children +
      this.layoutStyle.padding[LayoutStyleTypes.Direction.Right]
    );
  }
  addBorderWidth(inner: number): number {
    return (
      this.layoutStyle.borderWidth[LayoutStyleTypes.Direction.Left] +
      inner +
      this.layoutStyle.borderWidth[LayoutStyleTypes.Direction.Right]
    );
  }
  calcMinWidth(): number {
    switch (this.layoutStyle.position) {
      case "fixed":
        return 0;
      case "absolute":
        return (
          this.layoutStyle.left +
          this.addBorderWidth(this.addPaddingWidth(this.calcChildrenWidthMin()))
        );
      case "relative":
      case "initial":
        return this.addBorderWidth(
          this.addPaddingWidth(this.calcChildrenWidthMin())
        );
    }
  }
  calcMaxWidth(): number {
    //     switch (this.layoutStyle.position) {
    //         case "fixed":
    //           return 0;
    //         case "absolute":
    //           return (
    //             this.layoutStyle.left +
    //             this.addBorderWidth(this.addPaddingWidth(this.calcChildrenWidthMin()))
    //           );
    //         case "relative":
    //         case "initial":
    //           return this.addBorderWidth(
    //             this.addPaddingWidth(this.calcChildrenWidthMin())
    //           );
    //       }
    throw new Error();
  }
  actually: [number, number, number, number] = [-1, -1, -1, -1];
  applyWidth(left: number) {
    let pos = left + this.layoutStyle.margin[LayoutStyleTypes.Direction.Left];
    this.actually[0] = pos;
    pos +=
      this.layoutStyle.borderWidth[LayoutStyleTypes.Direction.Left] +
      this.layoutStyle.padding[LayoutStyleTypes.Direction.Left];
    for (const c of this.children) {
      pos += c.applyWidth(pos);
    }
    pos += this.layoutStyle.padding[LayoutStyleTypes.Direction.Right];
    this.actually[1] = pos;
    pos +=
      this.layoutStyle.borderWidth[LayoutStyleTypes.Direction.Right] +
      this.layoutStyle.margin[LayoutStyleTypes.Direction.Right];
    return pos - left;
  }
}

namespace LayoutStyleTypes {
  export type Position = "initial" | "relative" | "absolute" | "fixed";
  export type FourDirection<T> = [T, T, T, T];
  export enum Direction {
    Left = 0,
    Right = 1,
    Top = 3,
    Bottom = 4,
  }
}
export class TextLayout implements Layout {
  constructor(text: string) {
    this.text = text;
  }
  text: string;
  calcMinWidth(): number {
    return this.text.length;
  }
  calcMaxWidth(): number {
    return this.text.length;
  }
  actually: [number, number, number, number] = [-1, -1, -1, -1];
  applyWidth(left: number) {
    let pos = left;
    this.actually[0] = pos;
    pos += this.text.length;
    this.actually[1] = pos;
    return pos - left;
  }
}
export class BlankLayout implements Layout {
  calcMinWidth(): number {
    return 0;
  }
  calcMaxWidth(): number {
    return 0;
  }
  actually: [number, number, number, number] = [-1, -1, -1, -1];
  applyWidth(left: number) {
    let pos = left;
    this.actually[0] = pos;
    this.actually[1] = pos;
    return 0;
  }
}

export class LayoutStyle {
  position: LayoutStyleTypes.Position = "initial";
  padding: LayoutStyleTypes.FourDirection<number> = [0, 0, 0, 0];
  margin: LayoutStyleTypes.FourDirection<number> = [0, 0, 0, 0];
  borderWidth: LayoutStyleTypes.FourDirection<number> = [0, 0, 0, 0];
  left: number = 0;
  top: number = 0;
}
