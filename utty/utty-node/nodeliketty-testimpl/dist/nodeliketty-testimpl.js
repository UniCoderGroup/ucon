export default class TestImpl {
    lines = [""];
    operateHistory = [];
    operateHistoryBlanks = 0;
    y = 0;
    x = 0;
    resizeListeners = [];
    _columns = 100;
    opPush(str) {
        this.operateHistory.push("  ".repeat(this.operateHistoryBlanks) + str);
    }
    opStartFunc(name, ...args) {
        this.opPush(`CALL [${name}] (${args.join(", ")})`);
        this.operateHistoryBlanks++;
    }
    opEndFunc(retVal) {
        this.operateHistoryBlanks--;
        this.opPush(` =>${retVal ?? "void"}`);
    }
    get columns() {
        this.opStartFunc(`get columns`);
        this.opEndFunc(this._columns);
        return this._columns;
    }
    set columns(col) {
        this.opStartFunc(`set columns`, col);
        this.opPush(`SET this._columns TO ${col}`);
        this._columns = col;
        this.callResizeListener();
        this.opEndFunc();
    }
    _rows = 100;
    get rows() {
        this.opStartFunc(`get rows`);
        this.opEndFunc(this._rows);
        return this._rows;
    }
    set rows(row) {
        this.opStartFunc(`set rows`, row);
        this.opPush(`SET this._rows TO ${row}`);
        this._rows = row;
        this.callResizeListener();
        this.opEndFunc();
    }
    callResizeListener() {
        this.opStartFunc(`callResizeListener`);
        this.resizeListeners.forEach((value) => value());
        this.opEndFunc();
    }
    on(_event, listener) {
        this.resizeListeners.push(listener);
        return this;
    }
    getColorDepth() {
        return 24;
    }
    write(buffer, cb) {
        this.opStartFunc("write", buffer, cb);
        let crtLine = "";
        for (let c of buffer) {
            if (c === "\n") {
                this.opPush(`MEET \\n`);
                this.x += crtLine.length;
                this.opPush(`INCREASE X with ${crtLine.length}. NOW X IS ${this.x}`);
                this.lines[this.y] += crtLine;
                this.opPush(`ADD STRING ${crtLine} AT LINE[${this.y}]`);
                crtLine = "";
                this.y++;
                this.opPush(`this.y++;\t=>${this.y}`);
                this.x = 0;
                this.opPush("this.x = 0;");
                this.lines.push("");
                this.opPush(`this.lines.push(\"\");\t=>${this.lines.join(" | ")}`);
            }
            else {
                crtLine += c;
            }
        }
        this.x += crtLine.length;
        this.opPush(`INCREASE X with ${crtLine.length}. NOW X IS ${this.x}`);
        this.lines[this.y] += crtLine;
        this.opPush(`ADD STRING ${crtLine} AT LINE[${this.y}]`);
        this.opPush(`NOW LINES ARE  ${this.lines.join(" | ")}`);
        this.opEndFunc(true);
        return true;
    }
    clearLine(dir) {
        this.opStartFunc("clearLine", dir);
        this.lines[this.y] = "";
        this.opPush(`this.lines[${this.y}] = \"\";\t=>${this.lines.join(" | ")}`);
        this.x = 0;
        this.opPush("this.x = 0;");
        this.opEndFunc(true);
        return true;
    }
    moveCursor(dx, dy) {
        this.opStartFunc("moveCursor", dx, dy);
        this.x += dx;
        this.opPush(`this.x += dx(${dx});\t=>${this.x}`);
        this.y += dy;
        this.opPush(`this.y += dy(${dy});\t=>${this.y}`);
        this.opEndFunc(true);
        return true;
    }
    cursorTo(x, y) {
        this.opStartFunc("cursorTo", x, y);
        this.x = x;
        this.opPush(`this.x = x(${x});\t=>${this.x}`);
        if (y !== undefined) {
            this.y = y;
            this.opPush(`this.y = y(${y});\t=>${this.y}`);
        }
        this.opEndFunc(true);
        return true;
    }
}
//# sourceMappingURL=nodeliketty-testimpl.js.map