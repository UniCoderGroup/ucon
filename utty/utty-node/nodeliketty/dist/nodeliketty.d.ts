/// <reference types="node" />
import { Direction } from "node:tty";
export { Direction };
export default interface NodeLikeTty {
    /**
     * A `number` specifying the number of columns the TTY currently has. This property
     * is updated whenever the `'resize'` event is emitted.
     * @since v0.7.7
     */
    columns: number;
    /**
     * A `number` specifying the number of rows the TTY currently has. This property
     * is updated whenever the `'resize'` event is emitted.
     * @since v0.7.7
     */
    rows: number;
    /**
     * Write to tty without nextline.
     */
    write(buffer: Uint8Array | string): boolean;
    /**
     * `listener` will be called when tty resizes.
     */
    on(event: "resize", listener: () => void): this;
    /**
     * `writeStream.clearLine()` clears the current line of this `WriteStream` in a
     * direction identified by `dir`.
     */
    clearLine(dir: Direction): boolean;
    /**
     * `writeStream.cursorTo()` moves this `WriteStream`'s cursor to the specified
     * position.
     * @since v0.7.7
     * @param callback Invoked once the operation completes.
     * @return `false` if the stream wishes for the calling code to wait for the `'drain'` event to be emitted before continuing to write additional data; otherwise `true`.
     */
    cursorTo(x: number, y?: number): boolean;
    /**
     * `writeStream.moveCursor()` moves this `WriteStream`'s cursor _relative_ to its
     * current position.
     * @since v0.7.7
     * @param callback Invoked once the operation completes.
     * @return `false` if the stream wishes for the calling code to wait for the `'drain'` event to be emitted before continuing to write additional data; otherwise `true`.
     */
    moveCursor(dx: number, dy: number): boolean;
    /**
     * Returns:
     *
     * * `1` for 2,
     * * `4` for 16,
     * * `8` for 256,
     * * `24` for 16,777,216 colors supported.
     *
     * Use this to determine what colors the terminal supports. Due to the nature of
     * colors in terminals it is possible to either have false positives or false
     * negatives. It depends on process information and the environment variables that
     * may lie about what terminal is used.
     * It is possible to pass in an `env` object to simulate the usage of a specific
     * terminal. This can be useful to check how specific environment settings behave.
     *
     * To enforce a specific color support, use one of the below environment settings.
     *
     * * 2 colors: `FORCE_COLOR = 0` (Disables colors)
     * * 16 colors: `FORCE_COLOR = 1`
     * * 256 colors: `FORCE_COLOR = 2`
     * * 16,777,216 colors: `FORCE_COLOR = 3`
     *
     * Disabling color support is also possible by using the `NO_COLOR` and`NODE_DISABLE_COLORS` environment variables.
     * @since v9.9.0
     * @param [env=process.env] An object containing the environment variables to check. This enables simulating the usage of a specific terminal.
     */
    getColorDepth(): number;
}
