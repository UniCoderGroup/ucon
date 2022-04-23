import { CreateComponentAndInit, get_default_ucon, InlineComponent } from "ucon";

///// Symbol ///////////////////////////////////////////////
export type SymbolIconNames = "tick" | "alert" | "cross" | "info";
export interface SymbolIconProps {
  name: SymbolIconNames;
}
export  class SymbolIcon extends InlineComponent<SymbolIconProps> {
  SymbolCharTable = new Map<SymbolIconNames, string>([
    ["tick", "\u2714"],
    ["alert", "\u26A0"],
    ["cross", "\u274C"],
    ["info", "\u2139"],
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
  return CreateComponentAndInit(SymbolIcon, { name }, get_default_ucon());
}
////////////////////////////////////////////////////////////
