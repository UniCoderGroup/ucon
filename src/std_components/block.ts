import chalk from "chalk";
import { ContainerComponent } from "../component";
import { ContentsArgs } from "../global";
import { MidwareContext } from "../line";
import { chalkjs, combiner, inlStr } from "./inline";

///// GroupBox /////////////////////////////////////////////
//eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface GroupBoxProps {}
export class GroupBox extends ContainerComponent<GroupBoxProps> {
  begin(...title: ContentsArgs) {
    this.con.addLine(combiner("\u256D\u2574", chalkjs(chalk.bold, ...title)));
    this.register();
  }
  getMidware() {
    return function (ctx: MidwareContext) {
      return "\u2502  " + ctx.next();
    };
  }
  end() {
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
