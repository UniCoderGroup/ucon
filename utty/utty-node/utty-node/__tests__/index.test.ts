import UNodeTty from "../";
import TestImpl from "nodeliketty-testimpl";
import chalk from "chalk";

const fake = new TestImpl();
const t = new UNodeTty(fake);
let lines: string[] = [];

describe("Test UNodeTty", () => {
  it("should be able to push line correctly", () => {
    for (let i = 0; i < 10; i++) {
      t.pushLine(["L" + i, {}]);
    }
    for (let i = 0; i < 10; i++) {
      lines.push("L" + i);
    }
    lines.push("");
    expect(fake.lines).toEqual(lines);
  });
  it("should be able to replace line correctly", () => {
    t.replace(3, ["L3-new", {}]);
    lines[3] = "L3-new";
    expect(fake.lines).toEqual(lines);
  });
  it("should be able to clear line correctly", () => {
    expect(fake.x === 0).toBeFalsy();
    t.clearLine(4);
    lines[4] = "";
    expect(fake.lines).toEqual(lines);
    expect(fake.x).toBe(0);
  });
  it("should be able to pop a line correctly", () => {
    t.popLine();
    lines.pop();
    lines.pop();
    lines.push("");
    lines.push("");
    expect(fake.lines).toEqual(lines);
  });
  it("should be able to be resized correctly (rows)", () => {
    let called = false;
    let fn = () => {
      called = true;
    };
    t.onResize(fn);
    const originRows = fake.rows;
    fake.rows++;
    expect(t.rows).toBe(originRows + 1);
    expect(called).toBeTruthy();
  });
  it("should be able to be resized correctly (columns)", () => {
    let called = false;
    let fn = () => {
      called = true;
    };
    t.onResize(fn);
    const originColumns = fake.columns;
    fake.columns++;
    expect(t.columns).toBe(originColumns + 1);
    expect(called).toBeTruthy();
  });
  it("should be able to calculate the display width of an ansi-styled string", () => {
    const str = "STRING TO BE ANSI-STYLED";
    expect(t.getStrDisplayWidth(chalk.bgBlue.italic(str))).toBe(str.length);
  });
  it("should be able to move to a line", () => {
    const line = 3;
    t.moveToLine(line);
    expect(fake.y).toBe(line);
  });
});
