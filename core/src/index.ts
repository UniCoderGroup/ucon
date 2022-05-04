export * from "./global.js";
export * from "./ucon.js";
export * from "utty";
export * from "./component.js";
export * from "./std_components.js";

import UCon from "./ucon.js";
export default UCon;

var default_ucon_value: UCon;

export function get_default_ucon() {
  return default_ucon_value;
}
export function set_default_ucon(value: UCon) {
  default_ucon_value = value;
}
