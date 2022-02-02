export * from "./global";
export * from "./line";
export * from "./ucon";
export * from "utty";
export * from "./component";
export * from "./std_components";

import { stdout } from "node:process";
import UNodeTty from "utty-node";
import UCon from "./ucon";

export const ucon = new UCon(new UNodeTty(stdout));
export { UCon };
