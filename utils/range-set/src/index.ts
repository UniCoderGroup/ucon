export class RangeSet {
  constructor(ranges: number[] = []) {
    this.ranges = ranges;
  }
  ranges: number[];
  operate(table: OperateTruthTable, ...rs: RangeSet[]): RangeSet {
    return operate(
      table,
      this,
      rs.length === 1 ? rs[0] : rs[0].operate(table, ...rs.slice(1))
    );
  }
  union(...rs: RangeSet[]): RangeSet {
    return this.operate(truthTable_union, ...rs);
  }
  intersection(...rs: RangeSet[]): RangeSet {
    return this.operate(truthTable_intersection, ...rs);
  }
  get prettier() {
    let prettier: [number, number][] = [];
    for (let i = 0; i < this.ranges.length; i += 2)
      prettier.push([this.ranges[i], this.ranges[i + 1]]);
    return prettier;
  }
}

export type OperateTruthTable = [
  //          R:true    R:false
  /*L:true */ [boolean, boolean],
  /*L:flase*/ [boolean, boolean]
];

export const truthTable_union: OperateTruthTable = [
  [true, true],
  [true, false],
];
export const truthTable_intersection: OperateTruthTable = [
  [true, false],
  [false, false],
];

export function operate(
  table: OperateTruthTable,
  rs1: RangeSet,
  rs2: RangeSet
): RangeSet {
  let r1 = rs1.ranges,
    r2 = rs2.ranges,
    r = new RangeSet();
  let p1 = -1,
    p2 = -1;
  let s1 = false,
    s2 = false,
    s = false;
  while (p1 + 1 <= r1.length && p2 + 1 <= r2.length) {
    let crt = Math.max(
      p1 === -1 ? -Infinity : r1[p1],
      p2 === -1 ? -Infinity : r2[p2]
    );
    let b1 = s1,
      b2 = s2;
    if (r1[p1 + 1] < r2[p2 + 1] || p2 + 1 === r2.length) {
      p1++;
      s1 = !s1;
    } else {
      p2++;
      s2 = !s2;
    }
    if (table[b1 ? 0 : 1][b2 ? 0 : 1] !== s) {
      r.ranges.push(crt);
      s = !s;
    }
  }
  return r;
}

let x = new RangeSet([10, 30, 50, 100]),
  y = new RangeSet([20, 40, 110, 120]);
console.log(x.union(y, new RangeSet([150, 1430])).prettier);
