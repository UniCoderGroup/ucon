/**
 * A Configuration of what this UTty supports.
 */
 export interface UTtyConfig {
    /**
     * @description Save how many colors is supported in this tty
     * -  Node.js style -> `"NJS:x"`, `x` is a number.
     * 
     *    `x`=`1` for 2, `4` for 16, `8` for 256, `24` for 16,777,216 colors supported.
     *
     * - HTML/CSS supported -> `"BROWSER"` 
     */
    color?: string;

}

export interface LineContext {
    [key: string]: unknown;
}

export type LineContent = [string, LineContext];

/**
 * UTty's main declaration.
 * A standard for tty.
 */
export default interface UTty {
    /**
     * Configuration.
     */
    readonly config: UTtyConfig;

    /**
     * A `number` specifying the number of columns the TTY currently has. This property
     * is updated whenever the `'resize'` event is emitted.
     */
    columns: number;

    /**
     * A `number` specifying the number of rows the TTY currently has. This property
     * is updated whenever the `'resize'` event is emitted.
     */
    rows: number;

    /**
     * Push a new line at the end of lines.
     */
    pushLine(content: LineContent): void;

    /**
     * 
     * Pop the last line.
     */
    popLine(): void;

    /**
     * Replace a line.
     */
    replace(line: number, content: LineContent): void;

    /**
     * In a terminal, some characters (such as Chinese characters) have 2 width,
     * while some may not display.
     * This function is used to resolve str to get the display width.
     * @returns The display length of str.
     */
    getStrDisplayWidth(str: string): number;

    /**
     * When the tty resizes, call listeners.
     * Listeners should be stored in a array, and each one should be called.
     */
    onResize(listener: () => void): boolean;
}