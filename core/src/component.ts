import { ConForBlock, ConForContainer, ConForInline } from "./ucon.js";
import { Line, Midware, RefMidware } from "./line.js";
import { combiner, inlStr, Composition } from "./std_components.js";
import {
  CompositionH,
  CompositionV,
  ConForInput,
  ContentsArgs,
  get_default_ucon,
  Text,
} from "./index.js";
import _ from "lodash";
import {
  Focus,
  FocusEventHandler,
  FocusGroup,
  FocusGroupH,
  FocusGroupV,
  FocusItem,
} from "focus-system";

/**
 * The base class of all the components.
 */
export abstract class Component<
  P /*props*/ = unknown,
  C /*ConForSth*/ = unknown
> {
  constructor(props: P, con: C) {
    this.props = props;
    this.con = con;
  }

  /**
   * Defalt Properties.
   */
  readonly defaultProps: P | undefined = undefined;

  /**
   * Properties.
   */
  props: P;

  /**
   * UCon console.
   */
  readonly con: C;

  /**
   * Init the component.
   */
  init(): void {
    if (this.defaultProps) {
      if (typeof this.props === "object") {
        this.props = _.defaults(this.props, this.defaultProps);
      } else {
        this.props = this.props ?? this.defaultProps;
      }
    }
  }
}

/**
 * Get P (props) type of a Component.
 */
export type ComponentP<T extends Component> = T extends Component<infer P, any>
  ? P
  : never;
/**
 * Get C (ConForSth) type of a Component.
 */
export type ComponentC<T extends Component> = T extends Component<any, infer C>
  ? C
  : never;

export type ComponentConstructorParams<C extends Component> = [
  props: ComponentP<C>,
  con: ComponentC<C>
];

export type ComponentConstructor<C extends Component> = new (
  ...args: ComponentConstructorParams<C>
) => C;

/**
 * Block Component:
 * Component that print several lines in the screen.
 * @example Such as `ProgressBar`.
 */
export abstract class BlockComponent<P = unknown> extends Component<
  P,
  ConForBlock
> {
  constructor(props: P, con: ConForBlock = get_default_ucon()) {
    super(props, con);
  }

  /**
   * Lines of the output.
   */
  lines: Line[] = [];

  /**
   * If this component is mounted.
   */
  mounted = false;

  /**
   * If this component has never been mounted.
   */
  neverMounted = true;

  /**
   * Print to the screen.
   */
  mount(): void {
    if (this.neverMounted) {
      this.init();
      this.neverMounted = false;
    }
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
  constructor(props: P, con: ConForContainer = get_default_ucon()) {
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

  log(...objs: ContentsArgs): Line {
    return this.con.log(...objs);
  }

  /**
   * Called to begin this Container.
   * Always calls `this.init` before,
   * and `this.register` after outputing the beginning lines.
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
  constructor(props: P, con: ConForInline = get_default_ucon()) {
    super(props, con);
  }

  /**
   * Render returns the decorated text.
   * Wait for you to impl it.
   */
  abstract render(): string;
}

export type FocusPart =
  | {
      /**
       * `"H"` stands for horizontal.
       * `"V"` stands for vertical.
       */
      type: "H" | "V";
      children: FocusPart[];
    }
  | {
      /**
       * `"I"` stands for an item.
       */
      type: "I";
      content: BlockComponent;
      eventHandler?: FocusEventHandler;
    };

/**
 * Input Component:
 * Component that decorates one line
 * @example Such as `Combiner`,`Italitic`
 */
export abstract class InputComponent<P = unknown> extends Component<
  P,
  ConForInput
> {
  constructor(props: P, con: ConForInput = get_default_ucon()) {
    super(props, con);
  }

  focuses: Focus[] = [];

  displayer: BlockComponent | undefined;

  abstract render(): FocusPart;

  mount() {
    let result = this.render();
    function gen(part: FocusPart): [BlockComponent, Focus] {
      if (part.type === "I") {
        return [part.content, new FocusItem(part.eventHandler)];
      } else {
        let compositionCtor, focusCtor;
        switch (part.type) {
          case "H":
            compositionCtor = CompositionH;
            focusCtor = FocusGroupH;
            break;
          case "V":
            compositionCtor = CompositionV;
            focusCtor = FocusGroupV;
            break;
        }
        let children = part.children.map((v) => gen(v));
        return [
          new compositionCtor({
            components: children.map((v) => v[0]),
          }),
          new focusCtor(children.map((v) => v[1])),
        ];
      }
    }
    let [displayer, focus] = gen(result);
    this.displayer = displayer;
    this.displayer.mount();
    this.con.focusMap.children.push(focus);
  }

  unmount() {
    if (_.isUndefined(this.displayer))
      throw new Error("Cannot unmount unmounted component!");
    else this.displayer.unmount();
  }

  redraw() {
    this.unmount();
    this.mount();
  }
  //abstract onKeypress(): void;
  //abstract onFocusMove(args: FocusMoveArgs<InnerPos>): FocusMoveResult;
}

export function CreateComponentAndInit<C extends Component>(
  ctor: ComponentConstructor<C>,
  ...args: ComponentConstructorParams<C>
): C {
  const c = new ctor(...args);
  c.init();
  return c;
}
