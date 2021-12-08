export type Hint = (number|undefined);

export enum EdgeState {
  OFF,
  ON,
  UNKNOWN,
}

export default class Loopy {
  private hints: Hint[][];
  private vEdges: EdgeState[][];
  private hEdges: EdgeState[][];

  constructor(hints: Hint[][]) {
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
    return this.hEdges[row][column]
  }

  public getVEdge(row: number, column: number) {
    return this.vEdges[row][column]
  }

  public setHEdge(row: number, column: number, state: EdgeState) {
    this.hEdges[row][column] = state
  }

  public setVEdge(row: number, column: number, state: EdgeState) {
    this.vEdges[row][column] = state
  }

  public getHint(row: number, column: number): Hint {
    return this.hints[row][column];
  }

  public restart(): void {
    for (const row of this.vEdges) {
      for (let i = 0; i < row.length; ++i) {
        row[i] = EdgeState.UNKNOWN;
      }
    }
    for (const row of this.hEdges) {
      for (let i = 0; i < row.length; ++i) {
        row[i] = EdgeState.UNKNOWN;
      }
    }
  }

  public copy(): Loopy {
    return new Loopy(this.hints);
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
