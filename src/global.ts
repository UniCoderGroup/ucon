import { InlineComponent } from "./component";

/**
 * This type receive InlineComponents or strings as contents of an InlineComponent.
 */
export type ContentsArgs = (InlineComponent | string)[];

/**
 * This interface will be extended by an InlineComponent which receives contents.
 */
export interface ContentsProps {
    contents: ContentsArgs;
}

/**
 * This is the Blank value of ContentsProps.
 */
export const BlankContents: ContentsProps = {
    contents: [],
};