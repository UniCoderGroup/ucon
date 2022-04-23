import { Direction } from "node:tty";
export type { Direction };
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
   */
  getColorDepth(): number;
}
