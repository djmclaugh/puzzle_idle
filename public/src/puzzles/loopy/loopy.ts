import Puzzle from '../puzzle.js'

export type Hint = (number|undefined);

export enum EdgeState {
  OFF,
  ON,
  UNKNOWN,
}

function stateToString(e: EdgeState) {
  switch (e) {
    case EdgeState.UNKNOWN:
      return "UNKNOWN"
    case EdgeState.ON:
      return "ON"
    case EdgeState.OFF:
      return "OFF"
  }
}

export enum EdgeType {
  Horizontal,
  Vertical,
}

function typeToString(e: EdgeType) {
  switch (e) {
    case EdgeType.Horizontal:
      return "Horizontal"
    case EdgeType.Vertical:
      return "Vertical"
  }
}

export class Action {
  public constructor(
    public edgeType: EdgeType,
    public row: number,
    public column: number,
    public from: EdgeState,
    public state: EdgeState,
  ) {}

  public toString() {
    return `${typeToString(this.edgeType)} edge at column ${this.column} and row ${this.row} set to ${stateToString(this.state)}.`;
  }
}

export default class Loopy extends Puzzle<Action> {
  private hints: Hint[][];
  private vEdges: EdgeState[][];
  private hEdges: EdgeState[][];

  constructor(hints: Hint[][]) {
    super();
    this.hints = hints;
    this.vEdges = [];
    this.hEdges = [];
    for (let i = 0; i < this.n; ++i) {
      const row = [];
      for (let j = 0; j < this.n + 1; ++j) {
        row.push(EdgeState.UNKNOWN);
      }
      this.vEdges.push(row)
    }
    for (let i = 0; i < this.n + 1; ++i) {
      const row = [];
      for (let j = 0; j < this.n; ++j) {
        row.push(EdgeState.UNKNOWN);
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

  public setHEdge(row: number, column: number, state: EdgeState) {
    const was = this.hEdges[row][column];
    this.hEdges[row][column] = state;
    this.addAction(new Action(EdgeType.Horizontal, row, column, was, state));
  }

  public setVEdge(row: number, column: number, state: EdgeState) {
    const was = this.vEdges[row][column];
    this.vEdges[row][column] = state;
    this.addAction(new Action(EdgeType.Vertical, row, column, was, state));
  }

  // Returns [top, right, bottom, left]
  public getEdgesForCell(row: number, column: number): EdgeState[] {
    return [
      this.hEdges[row][column],
      this.vEdges[row][column + 1],
      this.hEdges[row + 1][column],
      this.vEdges[row][column],
    ];
  }

  // Returns [top, right, bottom, left]
  public getEdgesForNode(row: number, column: number): EdgeState[] {
    return [
      row == 0 ? EdgeState.OFF : this.vEdges[row - 1][column],
      column == this.n ? EdgeState.OFF : this.hEdges[row][column],
      row == this.n ? EdgeState.OFF : this.vEdges[row][column],
      column == 0 ? EdgeState.OFF : this.hEdges[row][column - 1],
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
    switch (a.edgeType) {
      case EdgeType.Vertical:
        this.vEdges[a.row][a.column] = a.from;
        break;
      case EdgeType.Horizontal:
        this.hEdges[a.row][a.column] = a.from;
        break;
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

    let otherState = a.state == EdgeState.OFF ? EdgeState.ON : EdgeState.OFF;
    switch (a.edgeType) {
      case EdgeType.Vertical:
        this.setVEdge(a.row, a.column, otherState);
        break;
      case EdgeType.Horizontal:
        this.setHEdge(a.row, a.column, otherState);
        break;
    }
  }

  public copy(): Loopy {
    return new Loopy(this.hints);
  }

  public isReadyForValidation(): boolean {
    for (let i = 0; i < this.n; ++i) {
      for (let j = 0; j < this.n + 1; ++j) {
        if (this.hEdges[j][i] == EdgeState.UNKNOWN) {
          return false;
        }
        if (this.vEdges[i][j] == EdgeState.UNKNOWN) {
          return false;
        }
      }
    }
    return true;
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
