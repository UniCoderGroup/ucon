import { InputComponent } from "../component";
import { FocusMoveArgs, FocusMoveResult } from "../focus";

interface SelectorProps {
  n: number;
  options: {
    name: string;
    value: unknown;
  }[];
}

class Selector extends InputComponent<SelectorProps, { n: number }> {
  onFocusMove(args: FocusMoveArgs<{ n: number }>): FocusMoveResult {
    
  }
  onKeypress(): void {}
  run(): void {}
}
