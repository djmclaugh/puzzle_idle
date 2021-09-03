import LatinSquare from './latin_square.js'
import TowersSolver from './solvers/towers_solver.js'

export enum HintFace {
  NORTH = 1,
  EAST = 2,
  SOUTH = 3,
  WEST = 4,
}

export function faceToString(face: HintFace) {
  switch(face) {
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

export function isVertical(face: HintFace) {
  switch(face) {
    case HintFace.WEST:
    case HintFace.EAST:
      return false;
    case HintFace.NORTH:
    case HintFace.SOUTH:
      return true;
  }
}

export function isReverse(face: HintFace) {
  switch(face) {
    case HintFace.SOUTH:
    case HintFace.EAST:
      return true;
    case HintFace.WEST:
    case HintFace.NORTH:
      return false;
  }
}

export function isClockwise(face: HintFace) {
  switch(face) {
    case HintFace.NORTH:
    case HintFace.EAST:
      return true;
    case HintFace.WEST:
    case HintFace.SOUTH:
      return false;
  }
}

export function next(face: HintFace) {
  return (face % 4) + 1;
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

export type Possibilities = Set<number>;

export default class Towers {
  private solution: LatinSquare = LatinSquare.fromString("");
  private given: number[][] = [];
  private westHints: number[] = [];
  private northHints: number[] = [];
  private eastHints: number[] = [];
  private southHints: number[] = [];

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
        return this.nHints
      case HintFace.EAST:
        return this.eHints
      case HintFace.SOUTH:
        return this.sHints
      case HintFace.WEST:
        return this.wHints
    }
  }

  public marks: Possibilities[][] = [];

  public get n() {
    return this.solution.n;
  }

  public marksRow(r: number) {
    return this.marks.map(row => row[r]);
  }

  public marksColumn(c: number) {
    return this.marks[c].concat();
  }

  constructor() {}

  public static randomOfSize(size: number): Towers {
    const t = new Towers();
    t.solution = LatinSquare.randomOfSize(size);
    //t.solution = LatinSquare.fromString("3 2 1 0 4\n0 1 4 2 3\n4 3 2 1 0\n1 4 0 3 2\n2 0 3 4 1");
    t.westHints = [];
    t.northHints = [];
    t.eastHints = [];
    t.southHints = [];
    for (let i = 0; i < size; ++i) {
      t.westHints.push(view(t.solution.row(i)));
      t.eastHints.push(view(t.solution.row(i).reverse()));
      t.northHints.push(view(t.solution.column(i)));
      t.southHints.push(view(t.solution.column(i).reverse()));
    }
    t.marks = [];
    t.given = [];
    const oneToN = [];
    for (let i = 0; i < t.n; ++i) {
      oneToN.push(i);
    }

    for (let i = 0; i < t.n; ++i) {
      t.marks.push([]);
      t.given.push([]);
      for (let j = 0; j < t.n; ++j) {
        t.marks[i].push(new Set(oneToN));
        t.given[i].push(-1);
      }
    }

    // Try to solve it to see if more hints should be given.
    // This way of generating hints works, but it's not uniform nor does it give you minimal sets of
    // hints.
    // TODO: improve
    // For example the first hint it gives might be implied by the second one, in that case, might
    // as well just give the second hint.

    TowersSolver.simpleViewSolve(t);
    TowersSolver.simpleLatinSolve(t, oneToN, oneToN);
    TowersSolver.viewAnalysisSolve(t);
    let count = 1;
    TowersSolver.depthSolve(t, count++);
    while(!t.isReadyForValidation()) {
      const problematicCells: [number, number][] = [];
      for (let i = 0; i < size; ++i) {
        for (let j = 0; j < size; ++j) {
          if (t.marks[i][j].size > 1) {
            problematicCells.push([i, j]);
          }
        }
      }
      const randomCoordinates = problematicCells[Math.floor(Math.random() * problematicCells.length)];
      const randomCell = t.marks[randomCoordinates[0]][randomCoordinates[1]];
      //const randomValue = Array.from(randomCell)[Math.floor(Math.random() * randomCell.size)];
      const value = t.solution.cell(randomCoordinates[0], randomCoordinates[1]);
      randomCell.clear();
      randomCell.add(value);
      t.given[randomCoordinates[0]][randomCoordinates[1]] = value;
      TowersSolver.simpleLatinSolve(t, [randomCoordinates[0]], [randomCoordinates[1]]);
      TowersSolver.viewAnalysisSolve(t);
      TowersSolver.viewAnalysisSolve(t);
      TowersSolver.depthSolve(t, count++);
    }


    for (let i = 0; i < t.n; ++i) {
      for (let j = 0; j < t.n; ++j) {
        if (t.given[i][j] != -1) {
          t.marks[i][j] = new Set([t.given[i][j]]);
        } else {
          t.marks[i][j] = new Set(oneToN);
        }
      }
    }

    return t;
  }

  public restart() {
    const oneToN = [];
    for (let i = 0; i < this.n; ++i) {
      oneToN.push(i);
    }
    for (let i = 0; i < this.n; ++i) {
      for (let j = 0; j < this.n; ++j) {
        if (this.given[i][j] != -1) {
          this.marks[i][j] = new Set([this.given[i][j]]);
        } else {
          this.marks[i][j] = new Set(oneToN);
        }
      }
    }
  }

  public copy(): Towers {
    const c = new Towers();
    c.solution = this.solution;
    c.northHints = this.northHints;
    c.eastHints = this.eastHints;
    c.southHints = this.southHints;
    c.westHints = this.westHints;
    c.marks = this.marks.map(columns => columns.map(s => new Set(s)));
    return c;
  }

  public isReadyForValidation(): boolean {
    for (const column of this.marks) {
      for (const cell of column) {
        if (cell.size != 1) {
          return false;
        }
      }
    }
    return true;
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

    for (let i = 0; i < this.solution.n; ++i) {
      let mid = '│' + this.solution.row(i).map(v => {
        return v + '│';
      }).join('');
      mid = (this.westHints[i] == -1 ? ' ' : this.westHints[i]) + mid;
      mid = mid + (this.eastHints[i] == -1 ? ' ' : this.eastHints[i]);
      rows.push(mid);
      if (i != this.solution.n - 1) {
        let row = ' ├';
        for (let i = 0; i < this.solution.n - 1; ++i) {
          row +='─┼';
        }
        row += '─┤ ';
        rows.push(row);
      }
    }

    let bottomRow = ' └';
    let bottomHint = '  ';
    for (let i = 0; i < this.solution.n - 1; ++i) {
      bottomRow +='─┴';
      bottomHint += (this.southHints[i] == -1 ? ' ' : this.southHints[i]) + ' ';
    }
    bottomRow += '─┘ ';
    bottomHint += (this.southHints[this.n - 1] == -1 ? ' ' : this.southHints[this.n - 1]) + '  ';
    rows.push(bottomRow);
    rows.push(bottomHint);

    return rows.join('\n');
  }

  public marksToString() {
    const rows: string[] = [];
    let topRow = '┌';
    for (let i = 0; i < this.n - 1; ++i) {
      topRow +='─┬';
    }
    topRow += '─┐';
    rows.push(topRow);

    for (let i = 0; i < this.solution.n; ++i) {
      let mid = '│' + this.marksRow(i).map(v => {
        if (v.size == 1) {
          return v.values().next().value + '│';
        } else {
          return '?' + '│';
        }
      }).join('');
      rows.push(mid);
      if (i != this.solution.n - 1) {
        let row = '├';
        for (let i = 0; i < this.solution.n - 1; ++i) {
          row +='─┼';
        }
        row += '─┤';
        rows.push(row);
      }
    }

    let bottomRow = '└';
    for (let i = 0; i < this.solution.n - 1; ++i) {
      bottomRow +='─┴';
    }
    bottomRow += '─┘';
    rows.push(bottomRow);

    return rows.join('\n');
  }

}
