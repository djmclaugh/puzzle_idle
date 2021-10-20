// Returns how many towers can be seen.
export function view(values: number[]) {
  let seen = 0;
  let max = -1;
  for (const value of values) {
    if (value > max) {
      seen += 1;
      max = value;
    }
  }
  return seen;
}

export type Possibilities = Set<number>;
export type Triple = {
  row: number,
  col: number,
  val: number,
};

export enum ActionType {
  REMOVE_POSSIBILITY,
  ADD_POSSIBILITY,
  REMOVE_HINT,
  ADD_HINT
};

export type CellAction = {
  row: number,
  column: number,
  value: number,
  type: ActionType.REMOVE_POSSIBILITY|ActionType.ADD_POSSIBILITY,
};

export type HintAction = {
  face: HintFace,
  index: number,
  type: ActionType.REMOVE_HINT|ActionType.ADD_HINT,
};

export type Action = CellAction|HintAction;

export type ActionCallback = (a: Action) => void;

export enum HintFace {
  WEST = 1,
  NORTH = 2,
  EAST = 3,
  SOUTH = 4,
}

export function faceToString(face: HintFace) {
  switch (face) {
    case HintFace.WEST:
      return "West";
    case HintFace.NORTH:
      return "North";
    case HintFace.EAST:
      return "East";
    case HintFace.SOUTH:
      return "South";
  }
}

export function isVertical(face: HintFace): boolean {
  return face % 2 == 0;
}

export function isHorizontal(face: HintFace): boolean {
  return !isVertical(face);
}

export function isReverse(face: HintFace): boolean {
  return face > 2;
}

export function isClockwise(face: HintFace): boolean {
  return face == HintFace.NORTH || face == HintFace.EAST;
}

export function getCoordinates(face: HintFace, hintIndex: number, index: number, n: number): [number, number] {
  let x = hintIndex;
  let y = index;
  if (isReverse(face)) {
    y = n - y - 1;
  }
  if (!isClockwise(face)) {
    x = n - x - 1;
  }
  if (isHorizontal(face)) {
    let temp = x;
    x = y;
    y = temp;
  }
  return [x, y];
}

export function next(face: HintFace): HintFace {
  return (face % 4) + 1;
}

export default class Towers {
  public grid: number[][];
  private westHints: number[];
  private northHints: number[];
  private eastHints: number[];
  private southHints: number[];

  // The user can put a mark a hint to signify that it won't provide any further
  // information.
  public westHintMarked: boolean[];
  public northHintMarked: boolean[];
  public eastHintMarked: boolean[];
  public southHintMarked: boolean[];

  public history: Action[] = [];
  public snapshots: number[] = [];

  public get wHints() {
    return this.westHints.concat();
  }
  public get nHints() {
    return this.northHints.concat();
  }
  public get eHints() {
    return this.eastHints.concat();
  }
  public get sHints() {
    return this.southHints.concat();
  }

  public getHints(face: HintFace) {
    switch(face) {
      case HintFace.NORTH:
        return this.nHints.concat();
      case HintFace.EAST:
        return this.eHints.concat();
      case HintFace.SOUTH:
        return this.sHints.concat();
      case HintFace.WEST:
        return this.wHints.concat();
    }
  }

  private marks: Possibilities[][] = [];

  private callbacks: Set<ActionCallback> = new Set();

  private addAction(a: Action) {
    this.history.push(a);
    this.callbacks.forEach((c) => {
      c(a);
    });
  }

  public onAction(a: ActionCallback) {
    this.callbacks.add(a);
  }

  public removeActionListener(a: ActionCallback) {
    this.callbacks.delete(a);
  }

  public undo(): void {
    const lastAction = this.history.pop();
    if (!lastAction) {
      return;
    }
    switch (lastAction.type) {
      case ActionType.ADD_POSSIBILITY:
        this.marks[lastAction.row][lastAction.column].delete(lastAction.value);
        break;
      case ActionType.REMOVE_POSSIBILITY:
        this.marks[lastAction.row][lastAction.column].add(lastAction.value);
        break;
      case ActionType.ADD_HINT:
        this.setHint(lastAction.face, lastAction.index, true);
        break;
      case ActionType.REMOVE_HINT:
        this.setHint(lastAction.face, lastAction.index, false);
        break;
    }
    while (this.history.length < this.snapshots[this.snapshots.length - 1]) {
      this.snapshots.pop();
    }
  }

  public takeSnapshot(): void {
    this.snapshots.push(this.history.length);
  }

  public restoreLatestSnapshot(): void {
    if (this.snapshots.length == 0) {
      this.restart();
    }
    while (this.history.length > this.snapshots[this.snapshots.length - 1]) {
      this.undo();
    }
    this.snapshots.pop();
  }

  public get n() {
    return this.grid.length;
  }

  public marksCell(r: number, c: number) {
    return this.marks[r][c];
  }

  public removeFromCell(r: number, c: number, value: number) {
    if (this.marks[r][c].delete(value)) {
      this.addAction({
        row: r,
        column: c,
        value: value,
        type: ActionType.REMOVE_POSSIBILITY,
      })
    }
  }

  public addToCell(r: number, c: number, value: number) {
    if (!this.marks[r][c].has(value)) {
      this.marks[r][c].add(value);
      this.addAction({
        row: r,
        column: c,
        value: value,
        type: ActionType.ADD_POSSIBILITY,
      })
    }
  }

  public setCell(r: number, c: number, value: number) {
    this.addToCell(r, c, value);
    for (let i = 0; i < this.grid.length; ++i) {
      if (i != value) {
        this.removeFromCell(r, c, i);
      }
    }
  }

  public markHint(f: HintFace, i: number) {
    this.setHint(f, i, true);
    this.addAction({
      face: f,
      index: i,
      type: ActionType.REMOVE_HINT
    });
  }

  public unmarkHint(f: HintFace, i: number) {
    this.setHint(f, i, false);
    this.addAction({
      face: f,
      index: i,
      type: ActionType.ADD_HINT
    });
  }

  private setHint(f: HintFace, i: number, value: boolean) {
    switch(f) {
      case HintFace.NORTH:
        this.northHintMarked[i] = value;
        break;
      case HintFace.EAST:
        this.eastHintMarked[i] = value;
        break;
      case HintFace.SOUTH:
        this.southHintMarked[i] = value;
        break;
      case HintFace.WEST:
        this.westHintMarked[i] = value;
        break;
    }
  }

  constructor(grid: number[][], wHints: number[], nHints: number[], eHints: number[], sHints: number[]) {
    this.westHints = wHints;
    this.northHints = nHints;
    this.eastHints = eHints;
    this.southHints = sHints;

    this.westHintMarked = [];
    this.northHintMarked = [];
    this.eastHintMarked = [];
    this.southHintMarked = [];

    this.grid = grid;
    this.marks = [];
    for (let i = 0; i < this.n; ++i) {
      this.westHintMarked.push(false);
      this.northHintMarked.push(false);
      this.eastHintMarked.push(false);
      this.southHintMarked.push(false);

      this.marks.push([]);
      for (let j = 0; j < this.n; ++j) {
        this.marks[i].push(new Set());
        if (this.grid[i][j] == -1) {
          for (let k = 0; k < this.n; ++k) {
            this.marks[i][j].add(k);
          }
        } else {
          this.marks[i][j].add(this.grid[i][j]);
        }
      }
    }
  }

  public copy(): Towers {
    return new Towers(this.grid, this.wHints, this.northHints, this.eastHints, this.southHints);
  }

  public static fromString(s: string): Towers {
    const rows = s.split("\n");
    const wHints: number[] = [];
    const nHints: number[] = [];
    const eHints: number[] = [];
    const sHints: number[] = [];
    const grid: number[][] = [];

    const n = rows.length - 2;

    for (let i = 0; i < n; ++i) {
      grid.push([]);
    }

    for (let i = 1; i < n + 1; ++i) {
      nHints.push(rows[0][i] == "?" ? -1 : parseInt(rows[0][i]));
      sHints.push(rows[n + 1][i] == "?" ? -1 : parseInt(rows[n + 1][i]));

      wHints.push(rows[i][0] == "?" ? -1 : parseInt(rows[i][0]));
      eHints.push(rows[i][n + 1] == "?" ? -1 : parseInt(rows[i][n + 1]));

      for (let row = 0; row < n; ++row) {
        grid[row].push(rows[row + 1][i] == "?" ? -1 : parseInt(rows[row + 1][i]));
      }
    }

    return new Towers(grid, wHints, nHints, eHints, sHints);
  }

  public restart() {
    while (this.history.length > 0) {
      this.undo();
    }
  }

  public get isReadyForValidation(): boolean {
    for (let r = 0; r < this.n; ++r) {
      for (let c = 0; c < this.n; ++c) {
        if (this.marks[r][c].size != 1) {
          return false;
        }
      }
    }
    return true;
  }

  public get hasContradiction(): boolean {
    for (let r = 0; r < this.n; ++r) {
      for (let c = 0; c < this.n; ++c) {
        if (this.marks[r][c].size == 0) {
          return true;
        }
      }
    }
    return false;
  }

  public solvedGrid(): number[][] {
    return this.marks.map(row => row.map(cell => cell.values().next().value));
  }

  public toString() {
    const rows: string[] = [];
    let topHint = '  ';
    let topRow = ' ┌';
    for (let i = 0; i < this.n - 1; ++i) {
      topRow +='─┬';
      topHint += (this.northHints[i] == -1 ? ' ' : this.northHints[i]) + ' ';
    }
    topRow += '─┐ ';
    topHint += (this.northHints[this.n - 1] == -1 ? ' ' : this.northHints[this.n - 1]) + '  ';
    rows.push(topHint);
    rows.push(topRow);

    for (let i = 0; i < this.grid.length; ++i) {
      let mid = '│' + this.grid[i].map(v => {
        return (v >= 0 ? v : "?") + '│';
      }).join('');
      mid = (this.westHints[i] == -1 ? ' ' : this.westHints[i]) + mid;
      mid = mid + (this.eastHints[i] == -1 ? ' ' : this.eastHints[i]);
      rows.push(mid);
      if (i != this.grid.length - 1) {
        let row = ' ├';
        for (let i = 0; i < this.grid.length - 1; ++i) {
          row +='─┼';
        }
        row += '─┤ ';
        rows.push(row);
      }
    }

    let bottomRow = ' └';
    let bottomHint = '  ';
    for (let i = 0; i < this.grid.length - 1; ++i) {
      bottomRow +='─┴';
      bottomHint += (this.southHints[i] == -1 ? ' ' : this.southHints[i]) + ' ';
    }
    bottomRow += '─┘ ';
    bottomHint += (this.southHints[this.n - 1] == -1 ? ' ' : this.southHints[this.n - 1]) + '  ';
    rows.push(bottomRow);
    rows.push(bottomHint);

    return rows.join('\n');
  }
}
