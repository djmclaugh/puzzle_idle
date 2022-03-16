import Puzzle from '../puzzle.js'
import { Triple, TripleCollection } from './triple_collection.js'
import ImplicationsTracker from './implications_tracker.js'
import VisibilityTracker from './visibility_tracker.js'
import { HintFace, isVertical } from './hint_face.js'
import { ContradictionType, TowersContradiction } from './towers_contradictions.js'

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
  SET_VISIBILITY,
  REMOVE_HINT,
  ADD_IMPLICATION,
};

export class CellAction {
  public constructor(
    public row: number,
    public column: number,
    public value: number,
    public type: ActionType.SET_POSSIBILITY|ActionType.REMOVE_POSSIBILITY,
    public previousPossibilities: Set<number>,
  ) {}

  public toString() {
    return `${this.value + 1} at (${this.column + 1}, ${this.row + 1})`;
  }
};

export type HintAction = {
  face: HintFace,
  index: number,
  type: ActionType.REMOVE_HINT,
};

export type ImplicationAction = {
  antecedent: [Triple, boolean],
  consequent: [Triple, boolean],
  type: ActionType.ADD_IMPLICATION,
};

export type VisibilityAction = {
  row?: number,
  col?: number,
  val?: number,
  seen: boolean,
  face: HintFace,
  type: ActionType.SET_VISIBILITY,
};

export type Action = CellAction|HintAction|ImplicationAction|VisibilityAction;

export type ActionCallback = (a: Action) => void;

export default class Towers extends Puzzle<Action> {
  public grid: number[][];
  protected contradiction: TowersContradiction|null = null;
  public westHints: number[];
  public northHints: number[];
  public eastHints: number[];
  public southHints: number[];

  // The user can put a mark a hint to signify that it won't provide any further
  // information.
  public westHintMarked: boolean[];
  public northHintMarked: boolean[];
  public eastHintMarked: boolean[];
  public southHintMarked: boolean[];

  public implications: ImplicationsTracker;
  public marks: TripleCollection;
  public visibility: VisibilityTracker = new VisibilityTracker();

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
      case ActionType.REMOVE_POSSIBILITY:
        this.marks.add({
          row: a.row,
          col: a.column,
          val: a.value,
        });
        break;
      case ActionType.REMOVE_HINT:
        this.setHint(a.face, a.index, false);
        break;
      case ActionType.SET_VISIBILITY:
        if (a.row !== undefined && a.col !== undefined && a.val === undefined) {
          this.visibility.removeRowColInfo(a.row, a.col, a.face, a.seen);
        } else if (a.row !== undefined && a.col === undefined && a.val !== undefined) {
          this.visibility.removeRowValInfo(a.row, a.val, a.face, a.seen);
        } else if (a.row === undefined && a.col !== undefined && a.val !== undefined) {
          this.visibility.removeColValInfo(a.col, a.val, a.face, a.seen);
        } else {
          throw new Error("Exactly one of row, col, or val should be undefined.");
        }
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

  public markHint(f: HintFace, i: number) {
    this.setHint(f, i, true);
    this.addAction({
      face: f,
      index: i,
      type: ActionType.REMOVE_HINT
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

  public setCellVisibility(row: number, col: number, face: HintFace, seen: boolean) {
    if (this.visibility.addRowColInfo(row, col, face, seen)) {
      this.addAction({
        row, col, face, seen, type: ActionType.SET_VISIBILITY,
      });
      const info = this.visibility.getWithRowCol(row, col)[face];
      if (info.seen && info.hidden) {
        this.noticeContradiction({
          noticedOnMove: this.history.length,
          type: ContradictionType.VIEW,
          cellIndices: [],
          rowIndex: isVertical(face) ? row : col,
          face: face,
        })
      }
    }
  }

  public setTowerVisibility(height: number, rowIndex: number, face: HintFace, seen: boolean) {
    if (isVertical(face)) {
      if (this.visibility.addColValInfo(rowIndex, height, face, seen)) {
        this.addAction({
          col: rowIndex, val: height, face, seen, type: ActionType.SET_VISIBILITY,
        });
      }
      const info = this.visibility.getWithColVal(rowIndex, height)[face];
      if (info.seen && info.hidden) {
        this.noticeContradiction({
          noticedOnMove: this.history.length,
          type: ContradictionType.VIEW,
          cellIndices: [],
          rowIndex: rowIndex,
          face: face,
        })
      }
    } else {
      if (this.visibility.addRowValInfo(rowIndex, height, face, seen)) {
        this.addAction({
          row: rowIndex, val: height, face, seen, type: ActionType.SET_VISIBILITY,
        });
      }
      const info = this.visibility.getWithRowVal(rowIndex, height)[face];
      if (info.seen && info.hidden) {
        this.noticeContradiction({
          noticedOnMove: this.history.length,
          type: ContradictionType.VIEW,
          cellIndices: [],
          rowIndex: rowIndex,
          face: face,
        })
      }
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
