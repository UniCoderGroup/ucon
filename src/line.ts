import { InlineComponent } from "./component";
import { ContainerStack } from "./ucon";

export interface MidwareContext {
  next: () => string;
  line: Line;
}

export type Midware = (ctx: MidwareContext) => string;

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
  render<AC extends Object>(additionalContext?: AC): string;
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
  render<AC extends Object>(additionalContext?: AC): string {
    /**
     * Create the `next` in the context of `n`th midware
     * @param n index of midware
     * @returns `next` in the context of `n`th midware
     */
    const createNext = (n: number) => {
      if (n === this.midwares.length - 1) {
        // Last midware
        const first = this.content;
        return () => {
          return first.render();
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
      ...(additionalContext === null ? {} : additionalContext),
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
