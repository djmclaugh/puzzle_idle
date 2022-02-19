import Puzzle from '../puzzle.js'

export type Hint = (number|undefined);

export type EdgeState = {
  ON: boolean,
  OFF: boolean,
}

function UNKOWN(): EdgeState {
  return  {ON: false, OFF: false};
}
function OFF(): EdgeState {
  return {ON: false, OFF: true};
}

export enum EdgeType {
  Horizontal,
  Vertical,
}

function edgeTypeToString(e: EdgeType) {
  switch (e) {
    case EdgeType.Horizontal:
      return "Horizontal"
    case EdgeType.Vertical:
      return "Vertical"
  }
}

export enum ActionType {
  ToggleOFF,
  ToggleON,
}

function actionTypeToString(a: ActionType) {
  switch (a) {
    case ActionType.ToggleOFF:
      return "OFF"
    case ActionType.ToggleON:
      return "ON"
  }
}

export class Action {
  public constructor(
    public edgeType: EdgeType,
    public row: number,
    public column: number,
    public type: ActionType,
  ) {}

  public toString() {
    return `${edgeTypeToString(this.edgeType)} edge at column ${this.column} and row ${this.row} set to ${actionTypeToString(this.type)}.`;
  }
}

export enum ContradictionType {
  NODE,
  CELL,
}

export type Contradiction = {
  type: ContradictionType,
  row: number,
  column: number,
  noticedOnMove: number,
}

export default class Loopy extends Puzzle<Action> {
  private hints: Hint[][];
  private vEdges: EdgeState[][];
  private hEdges: EdgeState[][];
  public contradiction: Contradiction|null = null;

  constructor(hints: Hint[][]) {
    super();
    this.hints = hints;
    this.vEdges = [];
    this.hEdges = [];
    for (let i = 0; i < this.n; ++i) {
      const row = [];
      for (let j = 0; j < this.n + 1; ++j) {
        row.push(UNKOWN());
      }
      this.vEdges.push(row)
    }
    for (let i = 0; i < this.n + 1; ++i) {
      const row = [];
      for (let j = 0; j < this.n; ++j) {
        row.push(UNKOWN());
      }
      this.hEdges.push(row)
    }
  }

  public get n(): number {
    return this.hints.length;
  }

  public getHEdge(row: number, column: number) {
    return this.hEdges[row][column];
  }

  public getVEdge(row: number, column: number) {
    return this.vEdges[row][column];
  }

  private applyAction(a: Action) {
    const grid = a.edgeType == EdgeType.Horizontal ? this.hEdges : this.vEdges;
    const edge = grid[a.row][a.column];
    switch (a.type) {
      case ActionType.ToggleOFF:
        edge.OFF = !edge.OFF;
        break;
      case ActionType.ToggleON:
        edge.ON = !edge.ON;
        break;
    }
  }

  public setEdgeON(edgeType: EdgeType, row: number, column: number) {
    const grid = edgeType == EdgeType.Horizontal ? this.hEdges : this.vEdges;
    if (grid[row][column].ON) {
      // Already ON, do nothing
      return;
    }
    const a: Action = new Action(edgeType, row, column, ActionType.ToggleON);
    this.applyAction(a);
    this.addAction(a);
  }

  public setEdgeOFF(edgeType: EdgeType, row: number, column: number) {
    const grid = edgeType == EdgeType.Horizontal ? this.hEdges : this.vEdges;
    if (grid[row][column].OFF) {
      // Already OFF, do nothing
      return;
    }
    const a: Action = new Action(edgeType, row, column, ActionType.ToggleOFF);
    this.applyAction(a);
    this.addAction(a);
  }

  public noticeNodeContradiction(row: number, column: number) {
    this.contradiction = {
      type: ContradictionType.NODE,
      row: row,
      column: column,
      noticedOnMove: this.history.length - 1,
    }
  }

  public noticeCellContradiction(row: number, column: number) {
    this.contradiction = {
      type: ContradictionType.CELL,
      row: row,
      column: column,
      noticedOnMove: this.history.length - 1,
    }
  }

  /**
   * Returns [top, right, bottom, left]
   */
  public getEdgesForCell(row: number, column: number): EdgeState[] {
    return [
      this.hEdges[row][column],
      this.vEdges[row][column + 1],
      this.hEdges[row + 1][column],
      this.vEdges[row][column],
    ];
  }

  public getCellsForEdge(type: EdgeType, row: number, column: number): {row: number, column: number}[] {
    const result: {row: number, column: number}[] = [];
    switch (type) {
      case EdgeType.Horizontal:
        if (row > 0) {
          result.push({row: row - 1, column: column});
        }
        if (row < this.n) {
          result.push({row: row, column: column});
        }
        break;
      case EdgeType.Vertical:
        if (column > 0) {
          result.push({row: row, column: column - 1});
        }
        if (column < this.n) {
          result.push({row: row, column: column});
        }
        break;
    }
    return result;
  }

  /**
   * Returns [top, right, bottom, left]
   */
  public getEdgesForNode(row: number, column: number): EdgeState[] {
    return [
      row == 0 ? OFF() : this.vEdges[row - 1][column],
      column == this.n ? OFF() : this.hEdges[row][column],
      row == this.n ? OFF() : this.vEdges[row][column],
      column == 0 ? OFF() : this.hEdges[row][column - 1],
    ];
  }

  public getHint(row: number, column: number): Hint {
    return this.hints[row][column];
  }

  public undo(): void {
    const a = this.history.pop();
    if (a === undefined) {
      return;
    }
    this.applyAction(a);
    if (this.contradiction !== null && this.contradiction.noticedOnMove >= this.history.length) {
      this.contradiction = null;
    }
    if (this.lastGuess !== undefined && this.history.length <= this.lastGuess) {
      this.guesses.pop();
    }
  }

  public markGuessAsImpossible(): void {
    const g = this.lastGuess;
    if (g === undefined) {
      return;
    }

    const a = this.history[g];
    this.abandonGuess();

    if (a.type == ActionType.ToggleOFF) {
      this.setEdgeON(a.edgeType, a.row, a.column);
    } else {
      this.setEdgeOFF(a.edgeType, a.row, a.column);
    }

  }

  public copy(): Loopy {
    return new Loopy(this.hints);
  }

  public isReadyForValidation(): boolean {
    for (let i = 0; i < this.n; ++i) {
      for (let j = 0; j < this.n + 1; ++j) {
        if (this.hEdges[j][i].OFF == this.hEdges[j][i].ON) {
          return false;
        }
        if (this.vEdges[i][j].OFF == this.vEdges[i][j].ON) {
          return false;
        }
      }
    }
    return true;
  }

  public hasContradiction(): boolean {
    if (this.contradiction !== null) {
      return true;
    }
    for (let i = 0; i < this.n; ++i) {
      for (let j = 0; j < this.n + 1; ++j) {
        if (this.hEdges[j][i].OFF && this.hEdges[j][i].ON) {
          return true;
        }
        if (this.vEdges[i][j].OFF && this.vEdges[i][j].ON) {
          return true;
        }
      }
    }
    return false;
  }

  public static fromString(s: string): Loopy {
    const rows: string[] = s.split("\n");

    // Each row ends with a new line, so remove the empty string at the end of
    // the array.
    rows.pop();

    const hints: Hint[][] = [];
    for (const row of rows) {
      const hintRow: Hint[] = [];
      for (let i = 0; i < row.length; ++i) {
        hintRow.push(row[i] === "." ? undefined : parseInt(row[i]));
      }
      hints.push(hintRow)
    }
    return new Loopy(hints);
  }
}
