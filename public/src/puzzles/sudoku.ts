export class Sudoku {
  private cells: number[][] = [];
  private subsectionDimensions: {x: number, y: number} = {x: 0, y: 0};

  public static generateNew(x: number, y: number): Sudoku {
    const s = new Sudoku();
    s.subsectionDimensions = {x, y};
    for (let i = 0; i < x * y; ++i) {
      s.cells.push([]);
      for (let j = 0; j < y * x; ++j) {
        s.cells[i].push(-1);
      }
    }
    return s;
  }

  constructor() {

  }

  get width() {
    return this.cells.length;
  }

  get height() {
    return this.cells[0].length;
  }
}
