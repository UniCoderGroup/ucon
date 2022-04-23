import {
  combiner,
  ContainerComponent,
  ContentsArgs,
  inlStr,
  Midware,
  MidwareContext,
} from "ucon";
import { chalkjs, chalk } from "./Chalkjs.js";

///// GroupBox /////////////////////////////////////////////
//eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface GroupBoxProps {}
export type GroupBoxBeginArgs = [...title: ContentsArgs];
export type GroupBoxEndArgs = [];
export class GroupBox extends ContainerComponent<
  GroupBoxProps,
  GroupBoxBeginArgs,
  GroupBoxEndArgs
> {
  begin(...args: GroupBoxBeginArgs) {
    this.init();
    this.con.addLine(combiner("\u256D\u2574", chalkjs(chalk.bold, ...args)));
    this.register();
    let x = args[0];
  }
  getMidware(): Midware {
    return function (ctx: MidwareContext) {
      const next = ctx.next();
      return ["\u2502  " + next[0], next[1]];
    };
  }
  end(..._args: GroupBoxEndArgs) {
    this.unregister();
    this.con.addLine(
      inlStr(
        "\u2570\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500"
      )
    );
  }
  /**
   * Show a section.
   */
  sect(...contents: ContentsArgs): void {
    this.unregister();
    this.con.addLine(combiner("\u251C\u2574", ...contents, ">"));
    this.register();
  }
  /**
   * Show a step.
   */
  step(...contents: ContentsArgs): void {
    this.unregister();
    this.con.addLine(combiner("\u2502\u2576 ", ...contents));
    this.register();
  }
}
////////////////////////////////////////////////////////////
