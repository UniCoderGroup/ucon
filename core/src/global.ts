import _ from "lodash";
// import { InlineComponent } from "./component.js";
// import { inlStr, combiner } from "./std_components.js";

// /**
//  * This type receive InlineComponents or strings as contents of an InlineComponent.
//  */
// export type ContentsArgs = (InlineComponent | string)[];

// /**
//  * This interface will be extended by an InlineComponent which receives contents.
//  */
// export interface ContentsProps {
//   contents: ContentsArgs;
// }

// /**
//  * This is the Blank value of ContentsProps.
//  */
// export const BlankContents: ContentsProps = {
//   contents: [],
// };

// export type RenderedLine = string | InlineComponent | ContentsArgs;

// export function renderedLine2InlineComponent(r: RenderedLine): InlineComponent {
//   if (typeof r === "string") {
//     return inlStr(r);
//   }
//   if (r instanceof InlineComponent) {
//     return r;
//   }
//   if (_.isArray(r)) {
//     return combiner(...r);
//   }
//   throw new TypeError("Unsupported rendered line type!");
// }

// export function combineRenderedLines(...rs: RenderedLine[]): RenderedLine {
//   let result: ContentsArgs = [];
//   for (const r of rs) {
//     if (typeof r === "string") {
//       result.push(r);
//     }
//     if (r instanceof InlineComponent) {
//       result.push(r);
//     }
//     if (_.isArray(r)) {
//       result = result.concat(r);
//     }
//   }
//   return result;
// }
