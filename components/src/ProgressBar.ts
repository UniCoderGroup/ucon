import { BlockComponent } from "ucon";
import { rightAlign } from "./Align.js";
import { chalkjs, chalk } from "./Chalkjs.js";

///// ProgressBar //////////////////////////////////////////
export interface ProgressBarProps {
  width: number;
  name: string;
  fractionDigits: number;
}
/**
 * ProgressBar: A standard BlockComponent.
 * Shows a progress in the screen.
 */
export class ProgressBar extends BlockComponent<ProgressBarProps> {
  defaultProps = {
    width: 30,
    name: "Progress",
    fractionDigits: 1,
  };
  current = 0;
  render() {
    const nOKed = Math.round(this.current * this.props.width);
    return [
      this.props.name +
        ": [" +
        chalkjs(chalk.bgWhite, " ".repeat(nOKed)).render() +
        " ".repeat(this.props.width - nOKed) +
        "]" +
        chalkjs(
          chalk.yellow,
          rightAlign(
            this.props.fractionDigits + 4,
            (this.current * 100).toFixed(this.props.fractionDigits)
          )
        ).render() +
        "%",
    ];
  }
  progress(float: number): number {
    if (this.current + float > 1) {
      this.current = 1;
    } else {
      this.current += float;
    }
    this.redraw();
    return this.current;
  }
}
////////////////////////////////////////////////////////////
