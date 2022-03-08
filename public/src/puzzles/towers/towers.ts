import Puzzle, {Contradiction} from '../puzzle.js'
import { Triple, TripleCollection } from './triple_collection.js'
import ImplicationsTracker from './implications_tracker.js'

function isDigit(s: string) {
  const charCode = s.charCodeAt(0);
  return s.length == 1 && s.charCodeAt(0) <= charCode && charCode <= s.charCodeAt(9);
}

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

export enum ActionType {
  SET_POSSIBILITY,
  REMOVE_POSSIBILITY,
  ADD_POSSIBILITY,
  REMOVE_HINT,
  ADD_HINT,
  ADD_IMPLICATION,
  REMOVE_IMPLICATION,
};

export class CellAction {
  public constructor(
    public row: number,
    public column: number,
    public value: number,
    public type: ActionType.SET_POSSIBILITY|ActionType.REMOVE_POSSIBILITY|ActionType.ADD_POSSIBILITY,
    public previousPossibilities: Set<number>,
  ) {}

  public toString() {
    return `${this.value + 1} at (${this.column + 1}, ${this.row + 1})`;
  }
};

export type HintAction = {
  face: HintFace,
  index: number,
  type: ActionType.REMOVE_HINT|ActionType.ADD_HINT,
};

export type ImplicationAction = {
  antecedent: [Triple, boolean],
  consequent: [Triple, boolean],
  type: ActionType.ADD_IMPLICATION|ActionType.REMOVE_IMPLICATION,
};

export type Action = CellAction|HintAction|ImplicationAction;

export type ActionCallback = (a: Action) => void;

export enum ContradictionType {
  NO_POSSIBILITES,
  ROW,
  COLUMN,
  VIEW,
}

export interface NoPossibilitiesContradiction {
  type: ContradictionType.NO_POSSIBILITES,
  noticedOnMove: number,
  row: number,
  col: number,
}

export interface RowContradiction {
  type: ContradictionType.ROW,
  noticedOnMove: number,
  row: number,
  col1: number,
  col2: number,
}

export interface ColumnContradiction {
  type: ContradictionType.COLUMN,
  noticedOnMove: number,
  col: number,
  row1: number,
  row2: number,
}

export interface ViewContradiction {
  type: ContradictionType.VIEW,
  noticedOnMove: number,
  face: HintFace,
  rowIndex: number,
  cellIndices: number[],
}

export type TowersContradiction = NoPossibilitiesContradiction|RowContradiction|ColumnContradiction|ViewContradiction

export function isNoPossibilitesContradiction(c: TowersContradiction): c is NoPossibilitiesContradiction {
  return c.type == ContradictionType.NO_POSSIBILITES;
}
export function isRowContradiction(c: TowersContradiction): c is RowContradiction {
  return c.type == ContradictionType.ROW;
}
export function isColumnContradiction(c: TowersContradiction): c is ColumnContradiction {
  return c.type == ContradictionType.COLUMN;
}
export function isViewContradiction(c: TowersContradiction): c is ViewContradiction {
  return c.type == ContradictionType.VIEW;
}

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

export default class Towers extends Puzzle<Action> {
  public grid: number[][];
  protected contradiction: TowersContradiction|null = null;
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

  public implications;

  public getContradiction(): TowersContradiction|null {
    return this.contradiction;
  }

  public noticeContradiction(c: TowersContradiction) {
    super.noticeContradiction(c);
  }

  public getHints(face: HintFace) {
    switch(face) {
      case HintFace.NORTH:
        return this.northHints.concat();
      case HintFace.EAST:
        return this.eastHints.concat();
      case HintFace.SOUTH:
        return this.southHints.concat();
      case HintFace.WEST:
        return this.westHints.concat();
    }
  }

  public getHintsMarked(face: HintFace) {
    switch(face) {
      case HintFace.NORTH:
        return this.northHintMarked.concat();
      case HintFace.EAST:
        return this.eastHintMarked.concat();
      case HintFace.SOUTH:
        return this.southHintMarked.concat();
      case HintFace.WEST:
        return this.westHintMarked.concat();
    }
  }

  public marks: TripleCollection;

  public undoAction(a: Action): void {
    switch (a.type) {
      case ActionType.SET_POSSIBILITY:
        for (let v of a.previousPossibilities) {
          this.marks.add({
            row: a.row,
            col: a.column,
            val: v,
          });
        }
        break;
      case ActionType.ADD_POSSIBILITY:
        this.marks.delete({
          row: a.row,
          col: a.column,
          val: a.value,
        });
        break;
      case ActionType.REMOVE_POSSIBILITY:
        this.marks.add({
          row: a.row,
          col: a.column,
          val: a.value,
        });
        break;
      case ActionType.ADD_HINT:
        this.setHint(a.face, a.index, true);
        break;
      case ActionType.REMOVE_HINT:
        this.setHint(a.face, a.index, false);
        break;
      case ActionType.ADD_IMPLICATION:
        if (a.antecedent[1] && a.consequent[1]) {
          this.implications.removeImplication(a.antecedent[0], a.consequent[0]);
        }
        if (!a.antecedent[1] && !a.consequent[1]) {
          this.implications.removeImplication(a.consequent[0], a.antecedent[0]);
        }
        if (a.antecedent[1] && !a.consequent[1]) {
          this.implications.removeOnToOffImplication(a.antecedent[0], a.consequent[0]);
        }
        if (!a.antecedent[1] && a.consequent[1]) {
          this.implications.removeOffToOnImplication(a.antecedent[0], a.consequent[0]);
        }
        break;
      case ActionType.REMOVE_IMPLICATION: {
        if (a.antecedent[1] && a.consequent[1]) {
          this.implications.addImplication(a.antecedent[0], a.consequent[0]);
        }
        if (!a.antecedent[1] && !a.consequent[1]) {
          this.implications.addImplication(a.consequent[0], a.antecedent[0]);
        }
        if (a.antecedent[1] && !a.consequent[1]) {
          this.implications.addOnToOffImplication(a.antecedent[0], a.consequent[0]);
        }
        if (!a.antecedent[1] && a.consequent[1]) {
          this.implications.addOffToOnImplication(a.antecedent[0], a.consequent[0]);
        }
        break;
      }
    }

  }

  public takeGuess(triple: Triple): void {
    this.guesses.push(this.history.length);
    this.setCell(triple.row, triple.col, triple.val);
  }

  public markGuessAsImpossible(): void {
    const g = this.lastGuess;
    if (g === undefined) {
      // Do nothing
      return;
    }

    this.abandonGuess();

    if (g instanceof CellAction) {
      this.removeFromCell(g.row, g.column, g.value);
    } else {
      throw Error("This should never happen");
    }
  }

  public get n() {
    return this.grid.length;
  }

  public marksCell(r: number, c: number) {
    return this.marks.getWithRowCol(r, c);
  }

  public removeFromCell(r: number, c: number, value: number) {
    const previous = new Set(this.marks.getWithRowCol(r, c));
    if (this.marks.delete({row: r, col: c, val: value})) {
      const a  = new CellAction(r, c, value, ActionType.REMOVE_POSSIBILITY, previous);
      this.addAction(a);
      if (this.marks.getWithRowCol(r, c).size == 0) {
        this.noticeContradiction({
          type: ContradictionType.NO_POSSIBILITES,
          row: r,
          col: c,
          noticedOnMove: this.history.length,
        })
      }
    }
  }

  public addToCell(r: number, c: number, value: number) {
    const t = {row: r, col: c, val: value};
    if (!this.marks.has(t)) {
      const previous = new Set(this.marks.getWithRowCol(r, c));
      this.marks.add(t);
      this.addAction(new CellAction(r, c, value, ActionType.ADD_POSSIBILITY, previous));
    }
  }

  public setCell(r: number, c: number, value: number) {
    const previous = new Set(this.marks.getWithRowCol(r, c));
    if (previous.size == 1 && previous.has(value)) {
      // If the cell is already set to the value, do nothing.
      return;
    }
    this.marks.add({row: r, col: c, val: value});
    for (let i = 0; i < this.grid.length; ++i) {
      if (i != value) {
        this.marks.delete({row: r, col: c, val: i});
      }
    }
    this.addAction(new CellAction(r, c, value, ActionType.SET_POSSIBILITY, previous));
  }

  public toggleHint(f: HintFace, i: number) {
    if (this.getHintsMarked(f)[i]) {
      this.unmarkHint(f, i);
    } else {
      this.markHint(f, i);
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

  public addImplication(a: Triple, c: Triple) {
    if (this.implications.addImplication(a, c)) {
      this.addAction({
        antecedent: [a, true],
        consequent: [c, true],
        type: ActionType.ADD_IMPLICATION
      });
      // const [setImplicators, removeImplicators] = this.implications.getImplicatorSet(
      //   new Set([a]),
      //   new Set([c]),
      //   new Set([a]),
      //   new Set([c])
      // );
      // for (const n of setImplicators) {
      //   if (this.implications.impliesContradiction(n)) {
      //     this.removeFromCell(n.row, n.col, n.val);
      //   }
      // }
      // for (const n of removeImplicators) {
      //   if (this.implications.removalImpliesContradiction(n)) {
      //     this.setCell(n.row, n.col, n.val);
      //   }
      // }
    }
  }

  public addOnToOffImplication(a: Triple, c: Triple) {
    if (this.implications.addOnToOffImplication(a, c)) {
      this.addAction({
        antecedent: [a, true],
        consequent: [c, false],
        type: ActionType.ADD_IMPLICATION
      });
      // const [setImplicators, removeImplicators] = this.implications.getImplicatorSet(
      //   new Set([a, c]),
      //   new Set(),
      //   new Set([a, c]),
      //   new Set()
      // );
      // for (const n of setImplicators) {
      //   if (this.implications.impliesContradiction(n)) {
      //     this.removeFromCell(n.row, n.col, n.val);
      //   }
      // }
      // for (const n of removeImplicators) {
      //   if (this.implications.removalImpliesContradiction(n)) {
      //     this.setCell(n.row, n.col, n.val);
      //   }
      // }
    }
  }

  public addOffToOnImplication(a: Triple, c: Triple) {
    if (this.implications.addOffToOnImplication(a, c)) {
      this.addAction({
        antecedent: [a, false],
        consequent: [c, true],
        type: ActionType.ADD_IMPLICATION
      });
      // const [setImplicators, removeImplicators] = this.implications.getImplicatorSet(
      //   new Set(),
      //   new Set([a, c]),
      //   new Set(),
      //   new Set([a, c])
      // );
      // for (const n of setImplicators) {
      //   if (this.implications.impliesContradiction(n)) {
      //     this.removeFromCell(n.row, n.col, n.val);
      //   }
      // }
      // for (const n of removeImplicators) {
      //   if (this.implications.removalImpliesContradiction(n)) {
      //     this.setCell(n.row, n.col, n.val);
      //   }
      // }
    }
  }

  constructor(grid: number[][], wHints: number[], nHints: number[], eHints: number[], sHints: number[]) {
    super();
    this.westHints = wHints;
    this.northHints = nHints;
    this.eastHints = eHints;
    this.southHints = sHints;

    this.westHintMarked = [];
    this.northHintMarked = [];
    this.eastHintMarked = [];
    this.southHintMarked = [];

    this.grid = grid;
    this.marks = new TripleCollection(this.grid.length);
    for (let i = 0; i < this.n; ++i) {
      this.westHintMarked.push(false);
      this.northHintMarked.push(false);
      this.eastHintMarked.push(false);
      this.southHintMarked.push(false);

      for (let j = 0; j < this.n; ++j) {
        if (this.grid[i][j] != -1) {
          for (let k = 0; k < this.n; ++k) {
            if (k != this.grid[i][j]) {
              this.marks.delete({row: i, col: j, val: k});
            }
          }
        }
      }
    }
    this.implications = new ImplicationsTracker(this.n);
  }

  public copy(): Towers {
    return new Towers(
      this.grid,
      this.getHints(HintFace.WEST),
      this.getHints(HintFace.NORTH),
      this.getHints(HintFace.EAST),
      this.getHints(HintFace.SOUTH)
    );
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

  public isReadyForValidation(): boolean {
    for (let r = 0; r < this.n; ++r) {
      for (let c = 0; c < this.n; ++c) {
        if (this.marks.getWithRowCol(r, c).size != 1) {
          return false;
        }
      }
    }
    return true;
  }

  public solvedGrid(): number[][] {
    const solved: number[][] = [];
    for (let i = 0; i < this.n; ++i) {
      solved.push([]);
      for (let j = 0; j < this.n; ++j) {
        solved[i].push(this.marks.getWithRowCol(i, j).values().next().value);
      }
    }
    return solved;
  }

  // Convert puzzle to ID compatible with Simon Tatham's implementation of
  // towers: https://www.chiark.greenend.org.uk/~sgtatham/puzzles/js/towers.html
  public toSimonTathamId(): string {
    const aCode = 'a'.charCodeAt(0);
    let result = `${this.n}:`;
    result += [
      this.northHints.map(h => h == -1 ? '' : (h).toString()).join('/'),
      this.southHints.map(h => h == -1 ? '' : (h).toString()).join('/'),
      this.westHints.map(h => h == -1 ? '' : (h).toString()).join('/'),
      this.eastHints.map(h => h == -1 ? '' : (h).toString()).join('/'),
    ].join('/');

    result += ',';

    let run = 0;
    for (let y = 0; y < this.n; ++y) {
      for (let x = 0; x < this.n; ++x) {
        if (this.grid[y][x] == -1) {
          run += 1;
        } else {
          if (run > 0) {
            result += 'z'.repeat(Math.floor(run / 26));
            const leftover = run % 26;
            if (leftover > 0) {
              result += String.fromCharCode(aCode + leftover - 1);
            }
            run = 0;
          } else if (x != 0 || y != 0) {
            result += '_';
          }
          result += (this.grid[y][x] + 1)
        }
      }
    }
    result += 'z'.repeat(Math.floor(run / 26));
    const leftover = run % 26;
    if (leftover > 0) {
      result += String.fromCharCode(aCode + leftover - 1);
    }

    return result;
  }

  public static fromSimonThatamId(id: String): Towers {
    const aCode = 'a'.charCodeAt(0);
    const zCode = 'z'.charCodeAt(0);
    const firstSplit = id.split(':');
    if (firstSplit.length != 2) {
      throw new Error('Game ID expects a colon in it.');
    }
    const size = parseInt(firstSplit[0]);
    const secondSplit = firstSplit[1].split(',');
    if (secondSplit.length > 2) {
      throw new Error('Game ID expects at most 1 comma in it.');
    }
    const view = secondSplit[0].split('/');
    if (view.length != 4 * size) {
      throw new Error(`Since size is ${size}, game ID expects exactly 4* size - 1 = ${4*size - 1} backslashes in it.`);
    }
    const nHints = [];
    const sHints = [];
    const wHints = [];
    const eHints = [];
    for (let i = 0; i < size; ++i) {
      nHints.push(view[i].length == 0 ? -1 : parseInt(view[i]));
    }
    for (let i = size; i < 2*size; ++i) {
      sHints.push(view[i].length == 0 ? -1 : parseInt(view[i]));
    }
    for (let i = 2*size; i < 3*size; ++i) {
      wHints.push(view[i].length == 0 ? -1 : parseInt(view[i]));
    }
    for (let i = 3*size; i < 4*size; ++i) {
      eHints.push(view[i].length == 0 ? -1 : parseInt(view[i]));
    }

    const grid: number[][] = [];
    if (secondSplit.length == 2) {
      const gridInfo = secondSplit[1];
      let run = 0;
      let infoIndex = 0;
      for (let y = 0; y < size; ++y) {
        grid.push([]);
        for (let x = 0; x < size; ++x) {
          if (run > 0) {
            grid[y].push(-1);
            run -= 1;
          } else {
            let char = gridInfo[infoIndex++];
            while (char == '_') {
              char = gridInfo[infoIndex++];
            }
            let charCode = char.charCodeAt(0);
            if (aCode <= charCode && charCode <= zCode) {
              grid[y].push(-1);
              run = charCode - aCode;
            } else {
              while (infoIndex < gridInfo.length - 1 && isDigit(gridInfo[infoIndex + 1])) {
                char += gridInfo[infoIndex++];
              }
              grid[y].push(parseInt(char) - 1);
            }
          }
        }
      }
    } else {
      for (let y = 0; y < size; ++y) {
        grid.push([]);
        for (let x = 0; x < size; ++x) {
          grid[y].push(-1);
        }
      }
    }

    return new Towers(grid, wHints, nHints, eHints, sHints);
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
