// import { ConForBlock, ConForContainer, ConForInline } from "./ucon.js";
// import { Line, Midware, RefMidware } from "./line.js";
// import {
//   CompositionH,
//   CompositionV,
//   ConForInput,
//   ContentsArgs,
//   get_default_ucon,
// } from "./index.js";
import _ from "lodash";
// import { RenderedLine, renderedLine2InlineComponent } from "./global";
// import {
//   Focus,
//   FocusEventHandler,
//   FocusGroup,
//   FocusGroupH,
//   FocusGroupV,
//   FocusItem,
// } from "focus-system";
// import { Unit } from "./unit.js";
import { OutputUnit } from "./outputUnit.js";
import { InputUnit } from "./inputUnit.js";
import { PositionUnit } from "./positionUnit.js";
import { Rendered } from "./rendering.js";

/**
 * The base class of all the components.
 */
export abstract class Component<Props = unknown> {
  constructor(props: Props) {
    this.props = props;
  }

  /**
   * Defalt Properties.
   */
  readonly defaultProps: Props | undefined = undefined;

  /**
   * Properties.
   */
  props: Props;

  output: OutputUnit = new OutputUnit(this);
  input: InputUnit = new InputUnit(this);
  position: PositionUnit = new PositionUnit(this);

  next: Component | undefined;

  abstract render(): Rendered;

  /**
   * Init the component.
   */
  init(next: Component): void {
    this.next = next;
    if (this.defaultProps) {
      if (typeof this.props === "object") {
        this.props = _.defaults(this.props, this.defaultProps);
      } else {
        this.props = this.props ?? this.defaultProps;
      }
    }
  }
}

export type ComponentProps<T extends Component> = T extends Component<
  infer Props
>
  ? Props
  : never;

export type ComponentConstructorParams<C extends Component> = [
  props: ComponentProps<C>
];

export type ComponentConstructor<C extends Component> = new (
  ...args: ComponentConstructorParams<C>
) => C;

// /**
//  * Container Component:
//  * Component that can process the log text.
//  * @example Such as `GroupBox`.
//  */
// export abstract class ContainerComponent<
//   P = unknown,
//   BA extends Array<unknown> = unknown[],
//   EA extends Array<unknown> = unknown[]
// > extends Component<P, ConForContainer> {
//   constructor(props: P, con: ConForContainer = get_default_ucon()) {
//     super(props, con);
//   }

//   /**
//    * Register to Console's Component Stack.
//    */
//   register(): void {
//     this.con.registerContainer(this);
//   }

//   /**
//    * Register itself.
//    */
//   unregister(): void {
//     this.con.unregisterContainer(this);
//   }

//   /**
//    * Called when a new line is created.
//    * @param ref Ununsed.
//    * @returns This component's midware.
//    */
//   newLine(ref: RefMidware): Midware {
//     return this.getMidware();
//   }

//   log(...objs: ContentsArgs): Line {
//     return this.con.log(...objs);
//   }

//   /**
//    * Called to begin this Container.
//    * Always calls `this.init` before,
//    * and `this.register` after outputing the beginning lines.
//    */
//   abstract begin(...args: BA): void;

//   /**
//    * @returns The midware.
//    */
//   abstract getMidware(...args: any): Midware;

//   /**
//    * Called when end this Container.
//    * Always calls `this.unregister`.
//    */
//   abstract end(...args: EA): void;
// }

// /**
//  * Get BA (`begin()` Args) type of a ContainerComponent.
//  */
// export type ContainerBA<T extends ContainerComponent> =
//   T extends ContainerComponent<any, infer BA, any> ? BA : never;

// /**
//  * Get EA (`end()` Args) type of a ContainerComponent.
//  */
// export type ContainerEA<T extends ContainerComponent> =
//   T extends ContainerComponent<any, any, infer EA> ? EA : never;

// export type ContainerComponentConstructor<
//   C extends ContainerComponent<P>,
//   P
// > = new (porps: P, con?: ConForContainer) => C;

// /**
//  * Inline Component:
//  * Component that decorates one line
//  * @example Such as `Combiner`,`Italitic`
//  */
// export abstract class InlineComponent<P = unknown> extends Component<
//   P,
//   ConForInline
// > {
//   constructor(props: P, con: ConForInline = get_default_ucon()) {
//     super(props, con);
//   }

//   /**
//    * Render returns the decorated text.
//    * Wait for you to impl it.
//    */
//   abstract render(): string;
// }

// export type FocusPart =
//   | {
//       /**
//        * `"H"` stands for horizontal.
//        * `"V"` stands for vertical.
//        */
//       type: "H" | "V";
//       children: FocusPart[];
//     }
//   | {
//       /**
//        * `"I"` stands for an item.
//        */
//       type: "I";
//       content: BlockComponent;
//       eventHandler?: FocusEventHandler;
//     };

// /**
//  * Input Component:
//  * Component that decorates one line
//  * @example Such as `Combiner`,`Italitic`
//  */
// export abstract class InputComponent<P = unknown> extends Component<
//   P,
//   ConForInput
// > {
//   constructor(props: P, con: ConForInput = get_default_ucon()) {
//     super(props, con);
//   }

//   focuses: Focus[] = [];

//   displayer: BlockComponent | undefined;

//   abstract render(): FocusPart;

//   mount() {
//     let result = this.render();
//     function gen(part: FocusPart): [BlockComponent, Focus] {
//       if (part.type === "I") {
//         return [part.content, new FocusItem(part.eventHandler)];
//       } else {
//         let compositionCtor, focusCtor;
//         switch (part.type) {
//           case "H":
//             compositionCtor = CompositionH;
//             focusCtor = FocusGroupH;
//             break;
//           case "V":
//             compositionCtor = CompositionV;
//             focusCtor = FocusGroupV;
//             break;
//         }
//         let children = part.children.map((v) => gen(v));
//         return [
//           new compositionCtor({
//             components: children.map((v) => v[0]),
//           }),
//           new focusCtor(children.map((v) => v[1])),
//         ];
//       }
//     }
//     let [displayer, focus] = gen(result);
//     this.displayer = displayer;
//     this.displayer.mount();
//     this.con.focusMap.children.push(focus);
//   }

//   unmount() {
//     if (_.isUndefined(this.displayer))
//       throw new Error("Cannot unmount unmounted component!");
//     else this.displayer.unmount();
//   }

//   redraw() {
//     this.unmount();
//     this.mount();
//   }
//   //abstract onKeypress(): void;
//   //abstract onFocusMove(args: FocusMoveArgs<InnerPos>): FocusMoveResult;
// }

// export function CreateComponentAndInit<C extends Component>(
//   ctor: ComponentConstructor<C>,
//   ...args: ComponentConstructorParams<C>
// ): C {
//   const c = new ctor(...args);
//   c.init();
//   return c;
// }
