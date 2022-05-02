export type Direction = "L" | "R" | "U" | "D";
export type FocusEventHandler = (type: string, ...args: any[]) => void;

export interface Rect {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export interface FocusSetContext {
  i: number[];
  setX(x: number): void;
  setY(y: number): void;
}

export type FocusInContext =
  | {
      direction: "L" | "R";
      setX(x: number): void;
      getY(): number;
    }
  | {
      direction: "U" | "D";
      setY(y: number): void;
      getX(): number;
    };

export interface FocusMoveContext {
  out(): boolean;
  to(focus: Focus): void;
  direction: Direction;
}

export abstract class Focus {
  rect: Rect | undefined;
  abstract onEvent(type: string, ...args: any[]): void;
  abstract setFocused(ctx: FocusSetContext): void;
  abstract setUnfocused(): void;
  abstract in(ctx: FocusInContext): void;
  abstract move(ctx: FocusMoveContext): void;
}

export class FocusItem extends Focus {
  constructor(eventHandler?: FocusEventHandler) {
    super();
    this.focused = false;
    this.eventHandler = eventHandler;
  }
  eventHandler?: FocusEventHandler;
  focused: boolean;
  emitEvent(type: string, ...args: any[]): void {
    if (this.eventHandler) this.eventHandler(type, ...args);
  }
  onEvent(type: string, ...args: any[]): void {
    this.emitEvent(type, ...args);
  }
  setFocused(ctx: FocusSetContext): void {
    if (ctx.i.length !== 0) {
      throw new Error("setFocused got wrong id array!");
    }
    if (!this.focused) {
      this.focused = true;
      this.emitEvent("in");
      ctx.setX((this.rect!.left + this.rect!.right) * 0.5);
      ctx.setY((this.rect!.top + this.rect!.bottom) * 0.5);
    }
  }
  setUnfocused(): void {
    if (this.focused) {
      this.focused = false;
      this.emitEvent("out");
    }
  }
  in(ctx: FocusInContext): void {
    this.focused = true;
    this.emitEvent("in");
    if (ctx.direction === "L" || ctx.direction === "R") {
      ctx.setX((this.rect!.left + this.rect!.right) * 0.5);
    } else if (ctx.direction === "U" || ctx.direction === "D") {
      ctx.setY((this.rect!.top + this.rect!.bottom) * 0.5);
    }
  }
  move(ctx: FocusMoveContext): void {
    if (ctx.out()) {
      this.focused = false;
      this.emitEvent("out");
    }
  }
}

export abstract class FocusGroup extends Focus {
  constructor(children: Focus[] = [], eventHandler?: FocusEventHandler) {
    super();
    this.children = children;
    this.eventHandler = eventHandler;
  }
  f: number = 0;
  children: Focus[];
  get current() {
    return this.children[this.f];
  }
  abstract getF(ctx: FocusInContext): number;
  eventHandler?: FocusEventHandler;
  emitEvent(type: string, ...args: any[]): void {
    if (this.eventHandler) this.eventHandler(type, ...args);
  }
  onEvent(type: string, ...args: any[]): void {
    this.emitEvent(type, ...args);
    this.current.onEvent(type, ...args);
  }
  setFocused(ctx: FocusSetContext): void {
    if (ctx.i.length < 1) {
      throw new Error("setFocused got wrong id array!");
    }
    this.current.setUnfocused();
    this.f = ctx.i[0];
    ctx.i = ctx.i.slice(1);
    this.current.setFocused(ctx);
  }
  setUnfocused(): void {
    this.current.setUnfocused();
  }
  in(ctx: FocusInContext): void {
    this.f = this.getF(ctx);
    this.current.in(ctx);
  }
}

export class FocusGroupV extends FocusGroup {
  getF(ctx: FocusInContext): number {
    let f = -1;
    switch (ctx.direction) {
      case "L":
      case "R":
        for (let i = 0; i < this.children.length - 1; i++) {
          let mid =
            (this.children[i].rect!.bottom + this.children[i + 1].rect!.top) / 2;
          if (ctx.getY() < mid) {
            f = i;
            break;
          }
        }
        if (f === -1) f = this.children.length - 1;
        break;
      case "U":
        f = this.children.length - 1;
        break;
      case "D":
        f = 0;
        break;
    }
    return f;
  }
  move(ctx: FocusMoveContext): void {
    let newCtx = ctx;
    if (ctx.direction === "U" || ctx.direction === "D") {
      newCtx = {
        direction: ctx.direction,
        out: () => {
          const df = ctx.direction === "U" ? -1 : 1;
          this.f += df;
          if (this.f < 0 || this.f >= this.children.length) {
            this.f -= df;
            return ctx.out();
          } else {
            ctx.to(this.current);
            return true;
          }
        },
        to: ctx.to,
      };
    }
    this.emitEvent("move", ctx.direction);
    this.current.move(newCtx);
  }
}
export class FocusGroupH extends FocusGroup {
  getF(ctx: FocusInContext): number {
    let f = -1;
    switch (ctx.direction) {
      case "U":
      case "D":
        for (let i = 0; i < this.children.length - 1; i++) {
          let mid =
            (this.children[i].rect!.right + this.children[i + 1].rect!.left) / 2;
          if (ctx.getX() < mid) {
            f = i;
            break;
          }
        }
        if (f === -1) f = this.children.length - 1;
        break;
      case "L":
        f = this.children.length - 1;
        break;
      case "R":
        f = 0;
        break;
    }
    return f;
  }
  move(ctx: FocusMoveContext): void {
    let newCtx = ctx;
    if (ctx.direction === "L" || ctx.direction === "R") {
      newCtx = {
        direction: ctx.direction,
        out: () => {
          const df = ctx.direction === "L" ? -1 : 1;
          this.f += df;
          if (this.f < 0 || this.f >= this.children.length) {
            this.f -= df;
            return ctx.out();
          } else {
            ctx.to(this.current);
            return true;
          }
        },
        to: ctx.to,
      };
    }
    this.emitEvent("move", ctx.direction);
    this.current.move(newCtx);
  }
}

export class FocusMap {
  __test__onCursorMove: () => void = () => {};
  _x: number = 0;
  get x() {
    return this._x;
  }
  set x(x: number) {
    this._x = x;
    this.__test__onCursorMove();
  }
  _y: number = 0;
  get y() {
    return this._y;
  }
  set y(y: number) {
    this._y = y;
    this.__test__onCursorMove();
  }
  f: number = 0;
  children: Focus[] = [];
  get current() {
    return this.children[this.f];
  }
  setFocused(i: number[]): void {
    this.current.setUnfocused();
    this.f = i[0];
    this.current.setFocused({
      i,
      setX: (x: number) => {
        this.x = x;
      },
      setY: (y: number) => {
        this.y = y;
      },
    });
  }
  move(d: Direction): void {
    this.current.move({
      direction: d,
      out: () => {
        if (d === "U" || d === "D") {
          const df = d === "U" ? -1 : 1;
          this.f += df;
          if (this.f < 0 || this.f >= this.children.length) {
            this.f -= df;
            this.y = Infinity * df;
            return false;
          } else {
            this.current.in({
              direction: d,
              setY: (y: number) => {
                this.y = y;
              },
              getX: () => this.x,
            });
            return true;
          }
        } else {
          this.x = d === "L" ? -Infinity : Infinity;
          return false;
        }
      },
      to: (focus: Focus) => this.to(d, focus),
    });
  }
  to(d: Direction, focus: Focus): void {
    if (d === "U" || d === "D") {
      focus.in({
        direction: d,
        setY: (y: number) => {
          this.y = y;
        },
        getX: () => this.x,
      });
    } else {
      focus.in({
        direction: d,
        setX: (x: number) => {
          this.x = x;
        },
        getY: () => this.y,
      });
    }
  }
  emitEvent(type: string, ...args: any[]): void {
    this.current.onEvent(type, ...args);
  }
}
