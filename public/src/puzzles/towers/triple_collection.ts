export type Triple = {
  row: number,
  col: number,
  val: number,
};

import { DoubleKeyMap } from '../../util/multi_key_map.js'

export class TripleCollection {

  private rowColMap: DoubleKeyMap<number, number, Set<number>> = new DoubleKeyMap();
  private rowValMap: DoubleKeyMap<number, number, Set<number>> = new DoubleKeyMap();
  private colValMap: DoubleKeyMap<number, number, Set<number>> = new DoubleKeyMap();

  constructor(private n: number = 0) {}

  public get size() {
    let result = 0;
    this.rowColMap.forEach((set) => {
      result += set.size;
    })
    return result;
  }

  public getWithRowCol(row: number, col: number): Set<number> {
    if (row === undefined || col === undefined) {
      debugger;
    }
    let s = this.rowColMap.get(row, col);
    if (s === undefined) {
      s = new Set();
      for (let i = 0; i < this.n; ++i) {
        s.add(i);
      }
      this.rowColMap.set(row, col, s);
    }
    return s;
  }
  public getWithRowVal(row: number, val: number): Set<number> {
    if (row === undefined || val === undefined) {
      debugger;
    }
    let s = this.rowValMap.get(row, val);
    if (s === undefined) {
      s = new Set();
      for (let i = 0; i < this.n; ++i) {
        s.add(i);
      }
      this.rowValMap.set(row, val, s);
    }
    return s;
  }
  public getWithColVal(col: number, val: number): Set<number> {
    if (val === undefined || col === undefined) {
      debugger;
    }
    let s = this.colValMap.get(col, val);
    if (s === undefined) {
      s = new Set();
      for (let i = 0; i < this.n; ++i) {
        s.add(i);
      }
      this.colValMap.set(col, val, s);
    }
    return s;
  }

  public has(t: Triple) {
    if (t === undefined || t.row === undefined || t.col === undefined || t.val === undefined) {
      debugger;
    }
    return this.getWithRowCol(t.row, t.col).has(t.val);
  }

  public add(t: Triple) {
    if (!this.has(t)) {
      this.getWithRowCol(t.row, t.col).add(t.val);
      this.getWithRowVal(t.row, t.val).add(t.col);
      this.getWithColVal(t.col, t.val).add(t.row);
    }
  }

  public delete(t: Triple): boolean {
    if (t.row === undefined) {
      debugger;
    }
    if (this.has(t)) {
      this.getWithRowCol(t.row, t.col).delete(t.val);
      this.getWithRowVal(t.row, t.val).delete(t.col);
      this.getWithColVal(t.col, t.val).delete(t.row);
      return true;
    }
    return false;
  }
}
