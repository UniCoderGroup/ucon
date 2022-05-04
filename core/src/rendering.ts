import { Component } from "./component";
import { FocusID } from "./inputUnit";
import { Position, PositionID } from "./positionUnit";
import _ from "lodash";
import { BlankLayout, DivLayout, Layout, LayoutStyle, TextLayout } from "./layout";

export type Rendered = RenderedPart[];

export interface RenderedPart {
  getLayout(): Layout;
}

export class RenderedFragment implements RenderedPart {
  constructor(parts: RenderedPart[]) {
    this.parts = parts;
  }
  parts: RenderedPart[];
  getLayout() {
    return new DivLayout(
      new LayoutStyle(),
      this.parts.map((v) => v.getLayout())
    );
  }
}

export function $(...parts: RenderedPart[]) {
  return new RenderedFragment(parts);
}

export class RenderedLocator implements RenderedPart {
  constructor(callback: LocatorCallback) {
    this.callback = callback;
  }
  callback: LocatorCallback;
  getLayout() {
    return new BlankLayout();
  }
}

export type LocatorCallback = (pos: Position) => void;

export function $L(callback: LocatorCallback): RenderedLocator {
  return new RenderedLocator(callback);
}

export class RenderedText implements RenderedPart {
  constructor(text: string) {
    this.text = text;
  }
  text: string;
  getLayout() {
    return new TextLayout(this.text);
  }
}

export function $T(text: string): RenderedText {
  return new RenderedText(text);
}

export function $P(this: Component, rangeID: PositionID) {
  const thisComponent = this;
  return function (...parts: RenderedPart[]) {
    return $(
      $L(thisComponent.position.getLocatorCallback(rangeID + "_L")),
      ...parts,
      $L(thisComponent.position.getLocatorCallback(rangeID + "_R"))
    );
  };
}

export function $F(this: Component, focusID: FocusID) {
  const thisComponent = this;
  thisComponent.input.focuses.set(focusID, {
    positionID: `FOCUS:${focusID}`,
  });
  return function (this: Component, ...parts: RenderedPart[]) {
    const positionID = thisComponent.input.getFocus(focusID)?.positionID;
    if (_.isUndefined(positionID)) throw new Error("Invalid position ID!");
    return $P.bind(this)(positionID)(...parts);
  };
}
