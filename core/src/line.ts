import { InlineComponent } from "./component.js";
import { ContainerStack } from "./ucon.js";
import { LineContext, LineContent } from "utty";

export type MidwareContext = LineContext & {
  next: () => LineContent;
  line: Line;
};

export type Midware = (ctx: MidwareContext) => LineContent;

export interface RefMidware {
  line: Line;
  midware: number;
}

export interface Line {
  get y(): number;
  set y(y: number);
  get content(): InlineComponent;
  set content(content: InlineComponent);
  get midwares(): Midware[];
  render(additionalContext?: LineContext): LineContent;
}

/**
 * Line.
 */
export class ConLine implements Line {
  constructor(y: number, content: InlineComponent) {
    this.y = y;
    this.content = content;
  }

  /**
   * The y coord in terminal.
   */
  y: number;

  /**
   * The Midwares.
   */
  midwares: Midware[] = [(ctx) => ctx.next()];

  /**
   * The first InlineComponent
   */
  content: InlineComponent;

  /**
   * Render this line.
   * @returns result text
   */
  render(additionalContext?: LineContext): LineContent {
    /**
     * Create the `next` in the context of `n`th midware
     * @param n index of midware
     * @returns `next` in the context of `n`th midware
     */
    const createNext: (n: number) => () => LineContent = (
      n: number
    ) => {
      if (n === this.midwares.length - 1) {
        // Last midware
        const first = this.content;
        return function () {
          return [first.render(), {}];
        };
      } else {
        const nextMidware = this.midwares[n + 1];
        return function (this: MidwareContext) {
          this.next = createNext(n + 1);
          return nextMidware(this);
        };
      }
    };
    return this.midwares[0]({
      next: createNext(0),
      line: this,
      ...(additionalContext === undefined ? {} : additionalContext),
    });
  }
}

/**
 * Create line.
 */
export function createLine(
  stack: ContainerStack,
  content: InlineComponent
): Line {
  const line = new ConLine(-1, content);
  for (const compo of stack) {
    line.midwares.push(
      compo.newLine({
        line: line,
        midware: line.midwares.length,
      })
    );
  }
  return line;
}
