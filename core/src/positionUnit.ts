import { Unit } from "./unit";
import { LocatorCallback } from "./rendering";
export class PositionUnit extends Unit {
  positions: Map<PositionID, Position> = new Map();

  getPosition(positionID: PositionID): Position | undefined {
    return this.positions.get(positionID);
  }
  setPosition(positionID: PositionID, pos: Position): void {
    this.positions.set(positionID, pos);
  }
  getLocatorCallback(positionID: PositionID): LocatorCallback {
    return (pos: Position) => {
      this.setPosition(positionID, pos);
    };
  }
}
export type PositionID = string;

export interface Position {
  value: number;
}
