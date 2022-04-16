/// <reference types="node" />
import NodeLikeTty, { Direction } from "nodeliketty";
export default class TestImpl implements NodeLikeTty {
    lines: string[];
    operateHistory: string[];
    operateHistoryBlanks: number;
    y: number;
    x: number;
    resizeListeners: (() => void)[];
    private _columns;
    opPush(str: any): void;
    opStartFunc(name: string, ...args: any[]): void;
    opEndFunc(retVal?: any): void;
    get columns(): number;
    set columns(col: number);
    private _rows;
    get rows(): number;
    set rows(row: number);
    callResizeListener(): void;
    on(_event: "resize", listener: () => void): this;
    getColorDepth(): number;
    write(buffer: Uint8Array | string, cb?: (err?: Error) => void): boolean;
    clearLine(dir: Direction): boolean;
    moveCursor(dx: number, dy: number): boolean;
    cursorTo(x: number, y?: number): boolean;
}
//# sourceMappingURL=nodeliketty-testimpl.d.ts.map