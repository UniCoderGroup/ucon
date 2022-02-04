import { ConForBlock, ConForContainer, ConForInline } from "./ucon";
import { Line, Midware, RefMidware } from "./line";
import { combiner, inlStr } from "./std_components/inline";
import ucon from "./index";

/**
 * The base class of all the components.
 */
export abstract class Component<P, C> {
  constructor(props: P, con: C) {
    this.props = props;
    this.con = con;
  }

  /**
   * Defalt Properties.
   */
  defaultProps: P | undefined = undefined;

  /**
   * Properties.
   */
  readonly props: P;

  /**
   * UCon console.
   */
  readonly con: C;
}

/**
 * Get P (props) type of a Component.
 */
export type ComponentP<T extends Component<unknown, unknown>> =
  T extends Component<infer P, any> ? P : never;

/**
 * Block Component:
 * Component that print several lines in the screen.
 * @example Such as `ProgressBar`.
 */
export abstract class BlockComponent<P = unknown> extends Component<
  P,
  ConForBlock
> {
  constructor(props: P, con: ConForBlock = ucon) {
    super(props, con);
  }

  /**
   * Lines of the output.
   */
  lines: Line[] = [];

  /**
   * Is this component mounted.
   */
  mounted = false;

  /**
   * Print to the screen.
   */
  mount(): void {
    this.mounted = true;
    const strs = this.render();
    for (const str of strs) {
      this.lines.push(this.con.addLine(inlStr(str)));
    }
  }

  unmount(): void {
    if (!this.mounted) throw new Error("Cannot unmount unmounted component!");
    for (let line of this.lines) {
      this.con.deleteLine(line);
    }
    this.mounted = false;
  }

  /**
   * Redraw the line of `offsetLine`.
   * @param offsetLine which line to redraw.
   */
  redraw(offsetLine = 0): void {
    this.lines[offsetLine].content = combiner(this.render()[offsetLine]);
    //If no proxy
    this.con.redraw(this.lines[offsetLine]);
  }

  /**
   * Redraw all lines.
   */
  redrawAll(): void {
    let strs = this.render();
    for (let i = 0; i < strs.length; i++) {
      this.lines[i].content = combiner(strs[i]);
      //If no proxy
      this.con.redraw(this.lines[i]);
    }
  }

  /**
   * Render returns lines of text.
   * Wait for you to impl it.
   */
  abstract render(): string[];
}

export type BlockComponentConstructor<C extends BlockComponent> = new (
  porps: ComponentP<C>,
  con?: ConForBlock
) => C;

/**
 * Container Component:
 * Component that can process the log text.
 * @example Such as `GroupBox`.
 */
export abstract class ContainerComponent<
  P = unknown,
  BA extends Array<unknown> = unknown[],
  EA extends Array<unknown> = unknown[]
> extends Component<P, ConForContainer> {
  constructor(props: P, con: ConForContainer = ucon) {
    super(props, con);
  }

  /**
   * Register to Console's Component Stack.
   */
  register(): void {
    this.con.registerContainer(this);
  }

  /**
   * Register itself.
   */
  unregister(): void {
    this.con.unregisterContainer(this);
  }

  /**
   * Called when a new line is created.
   * @param ref Ununsed.
   * @returns This component's midware.
   */
  newLine(ref: RefMidware): Midware {
    return this.getMidware();
  }

  /**
   * Called when begin this Container.
   * Always calls `this.register`.
   */
  abstract begin(...args: BA): void;

  /**
   * @returns The midware.
   */
  abstract getMidware(...args: any): Midware;

  /**
   * Called when end this Container.
   * Always calls `this.unregister`.
   */
  abstract end(...args: EA): void;
}

/**
 * Get BA (`begin()` Args) type of a ContainerComponent.
 */
export type ContainerBA<T extends ContainerComponent> =
  T extends ContainerComponent<any, infer BA, any> ? BA : never;

/**
 * Get EA (`end()` Args) type of a ContainerComponent.
 */
export type ContainerEA<T extends ContainerComponent> =
  T extends ContainerComponent<any, any, infer EA> ? EA : never;

export type ContainerComponentConstructor<
  C extends ContainerComponent<P>,
  P
> = new (porps: P, con?: ConForContainer) => C;

/**
 * Inline Component:
 * Component that decorates one line
 * @example Such as `Combiner`,`Italitic`
 */
export abstract class InlineComponent<P = unknown> extends Component<
  P,
  ConForInline
> {
  constructor(props: P, con: ConForInline = ucon) {
    super(props, con);
  }

  /**
   * Render returns the decorated text.
   * Wait for you to impl it.
   */
  abstract render(): string;
}
