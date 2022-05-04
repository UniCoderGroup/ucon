import UTty from "utty";
import { Rendered, RenderedPart } from "./rendering";

export class Target {
  constructor(tty: UTty) {
    this.tty = tty;
  }
  tty: UTty;

  doRendering(r: RenderedPart) {
    r.getLayout().calcMinWidth();
    r.getLayout().applyWidth(0);
  }
}
