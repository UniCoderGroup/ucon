import { Unit } from "./unit";
import { PositionID } from "./positionUnit";
// import * as FocusSystem from "focus-system";
export class InputUnit extends Unit {
  focuses: Map<FocusID, Focus> = new Map();

  getFocus(focusID: FocusID): Focus | undefined {
    return this.focuses.get(focusID);
  }
}
export type FocusID = string;

export interface Focus {
  positionID: PositionID;
}
