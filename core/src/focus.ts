import { InputComponent } from "./component";

export type FocusTarget = InputComponent;

export type FocusMoveDirection = "left" | "right" | "up" | "down";
export type FocusMoveArgs<InnerPos> =
  | ({
      moveInto: true;
      setInnerPos(innerPos: InnerPos): void;
    } & (
      | {
          direction: "left" | "right";
          y: number;
        }
      | {
          direction: "up" | "down";
          x: number;
        }
    ))
  | {
      moveInto: false;
      direction: FocusMoveDirection;
    };
export type FocusMoveResult =
  | ({
      type: "out";
    } & (
      | {
          direction: "left" | "right";
          y: number;
        }
      | {
          direction: "up" | "down";
          x: number;
        }
    ))
  | {
      type: "ok";
    };

export class Focusable{
  constructor(x:number,y:number){
    this.x=x;
    this.y=y;
  }
  x:number;
  y:number;
}

class FocusElement{
  this?:FocusElement;
  left?:FocusElement;
  right?:FocusElement;
  up?:FocusElement;
  down?:FocusElement;
}
export class FocusMap{

  focusables:Focusable[]=[];
}