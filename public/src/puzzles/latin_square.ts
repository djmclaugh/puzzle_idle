import { S3 } from './permutation.js'

export default class LatinSquare {
  private grid: number[][] = [];

  get n(): number {
    return this.grid.length;
  }

  private constructor(){}

  public row(index: number) {
    return this.grid.map(column => column[index]);
  }

  public column(index: number) {
    return this.grid[index].concat();
  }

  public static randomOfSize(size: number) {
    const square = new LatinSquare();
    for (let i = 0; i < size; ++i) {
      square.grid.push([]);
      for (let j = 0; j < size; ++j) {
        square.grid[i].push(-1);
      }
    }

    // Manually generate them for now until I find a way to do it somewhat uniformaly for larger
    // squares.
    if (size == 1) {
      square.grid[0][0] = 0;
    } else if (size == 2) {
      if (Math.random() < 0.5) {
        square.grid[0][0] = 0;
        square.grid[1][0] = 1;
        square.grid[0][1] = 1;
        square.grid[1][1] = 0;
      } else {
        square.grid[0][0] = 1;
        square.grid[1][0] = 0;
        square.grid[0][1] = 0;
        square.grid[1][1] = 1;
      }
    } else if (size == 3) {
      square.grid[0][0] = 0;
      square.grid[1][0] = 1;
      square.grid[2][0] = 2;
      if (Math.random() < 0.5) {
        square.grid[0][1] = 1;
        square.grid[1][1] = 2;
        square.grid[2][1] = 0;
        square.grid[0][2] = 2;
        square.grid[1][2] = 0;
        square.grid[2][2] = 1;
      } else {
        square.grid[0][1] = 2;
        square.grid[1][1] = 0;
        square.grid[2][1] = 1;
        square.grid[0][2] = 1;
        square.grid[1][2] = 2;
        square.grid[2][2] = 0;
      }
      const perm = S3[Math.floor(Math.random() * S3.length)];
      square.grid.forEach(column => {
        perm.applyToEach(column);
      });
    } else {
      throw new Error("Not yet implemented");
    }

    return square;
  }

  public toString() {
    const lines = [];
    for (let i = 0; i < this.n; ++i) {
      lines.push(this.grid[i].join(' '));
    }
    return lines.join('\n');
  }

  public static fromString(s: string) {
    const square = new LatinSquare();
    const grid = s.split('\n').map(row => row.split(' '));
    for (let i = 0; i < grid.length; ++i) {
      square.grid.push([]);
      for (let j = 0; j < grid.length; ++j) {
        square.grid[i].push(Number.parseInt(grid[i][j]));
      }
    }
    return square;
  }
}
