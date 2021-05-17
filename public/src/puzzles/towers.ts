import LatinSquare from './latin_square.js'

// Returns how many towers can be seen.
function view(values: number[]) {
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

type Possibilities = Set<number>;

export default class Towers {
  private solution: LatinSquare;
  private westHints: number[];
  private northHints: number[];
  private eastHints: number[];
  private southHints: number[];

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

  public marks: Possibilities[][];

  public get n() {
    return this.solution.n;
  }

  public marksRow(r: number) {
    return this.marks.map(row => row[r]);
  }

  public marksColumn(c: number) {
    return this.marks[c].concat();
  }

  constructor() {
    this.solution = LatinSquare.randomOfSize(3);
    this.westHints = [-1, -1, -1];
    this.northHints = [-1, -1, -1];
    this.eastHints = [-1, -1, -1];
    this.southHints = [-1, -1, -1];
    for (let i = 0; i < 3; ++i) {
      this.westHints[i] = view(this.solution.row(i));
      this.eastHints[i] = view(this.solution.row(i).reverse());
      this.northHints[i] = view(this.solution.column(i));
      this.southHints[i] = view(this.solution.column(i).reverse());
    }
    this.marks = [];
    for (let i = 0; i < this.n; ++i) {
      this.marks.push([]);
      for (let j = 0; j < this.n; ++j) {
        this.marks[i].push(new Set());
        for (let k = 0; k < this.n; ++k) {
          this.marks[i][j].add(k);
        }
      }
    }
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

}
