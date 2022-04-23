import {
  ContentsProps,
  InlineComponent,
  BlankContents,
  combiner,
  ContentsArgs,
  CreateComponentAndInit,
  get_default_ucon,
} from "ucon";
import chalk, { ChalkInstance } from "chalk";

///// ChalkJs //////////////////////////////////////////////
export interface ChalkjsProps extends ContentsProps {
  chalk: ChalkInstance;
}
export class Chalkjs extends InlineComponent<ChalkjsProps> {
  defaultProps = {
    chalk,
    ...BlankContents,
  };
  render() {
    return this.props.chalk(combiner(...this.props.contents).render());
  }
}
/**
 * Chalkjs: A standard InlineComponent
 * It calls chalk.js.
 */
export  function chalkjs(
  chalk: ChalkInstance,
  ...contents: ContentsArgs
): Chalkjs {
  return CreateComponentAndInit(
    Chalkjs,
    { chalk, contents },
    get_default_ucon()
  );
}
////////////////////////////////////////////////////////////

export { chalk };
export type { ChalkInstance };
