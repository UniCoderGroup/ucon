import { WriteStream as TtyWriteStream } from 'node:tty';

export default class UTty {
    constructor(tty: TtyWriteStream & { fd: 1 }) {
        this.tty = tty;
    }

    /**
     * The output stream.
     */
    tty: TtyWriteStream & { fd: 1 };

    /**
     * Curent y coord in terminal (start by 0).
     */
    y = 0;

    /**
     * The max of y
     */
    yMax = 0;

    /**
     * Write str and `'\n'` to stdout,
     * and add this.y according to number of `'\n'`s.
     */
    output(str: string, addYMax: boolean = true): void {
        this.tty.write(str + "\n");
        for (let c of str) {
            if (c === "\n") {
                this.y++;
                if (addYMax) this.yMax++;
            }
        }
        this.y++; // add the additional "\n"
        if (addYMax) this.yMax++;
    }

    /**
     * Redraw the line.
     */
    redraw(y: number, str: string): void {
        this.moveToLine(y);
        this.clearLine(0);
        this.output(str, false);
        this.moveToLastLine();
    }

    /**
     *  Reset `x` coord to 0
     */
    resetX(): void {
        this.tty.cursorTo(0);
    }

    /**
     * Move y coord of cursor
     * and add `dy` to `this.y`
     */
    moveY(dy: number): void {
        this.tty.moveCursor(0, dy);
        this.y += dy;
    }

    /**
     * Move to the first line of line,
     * and reset x coord to `0`.
     * [BUG]: It cannot go to row that above the screen
     */
    moveToLine(line: number): void {
        this.resetX();
        this.moveY(-(this.y - line));
    }

    /**
     * Move to last line according to `this.yMax`.
     */
    moveToLastLine(): void {
        this.resetX();
        this.moveY(this.yMax - this.y);
    }

    /**
     * Clear current line.
     * @param dir see param `dir` in http://nodejs.org/api/tty.html#writestreamclearlinedir-callback
     */
    clearLine(dir: -1 | 0 | 1 = 0): void {
        this.tty.clearLine(dir);
    }
}
