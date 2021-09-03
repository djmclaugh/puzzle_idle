import { randomPermutation } from './permutation.js'
import IsotopyClasses from './data/latin_squares/isotopy_classes.js'

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

  public cell(x:number, y: number): number {
    return this.grid[x][y];
  }

  private static randomIsotopyClass(size: number) {
    if (size >= IsotopyClasses.length) {
      throw new Error("Only have enough data to get isotopy classes of order 7 or less.");
    }
    // Not all isotopy classes have the same number of members.
    // So a uniform distribution for choosing the isotopy classe won't give us a uniform
    // distribution for all latin squares.
    // But this is good enough for now.
    // TODO: Figure this out
    return IsotopyClasses[size][Math.floor(Math.random() * IsotopyClasses[size].length)];
  }

  private static randomSquareFromIsotopyClass(isoClass: string) {
    // We can gat every element of an isotopy class by permutating the rows, columns, and labels.
    // But not each square has the same number of unique row, column, and label permutation
    // combinations that will lead to it.
    // So choosing row, column, and label permuations uniformly randomly won't determine a square
    // uniformly randomly
    // But this is good enough for now.
    // TODO: Figure this out
    const n = Math.sqrt(isoClass.length);
    const rowPerm = randomPermutation(n);
    const columnPerm = randomPermutation(n);
    const labelPerm = randomPermutation(n);

    const square = new LatinSquare();
    let index = 0;
    for (let i = 0; i < n; ++i) {
      const row = [];
      for (let j = 0; j < n; ++j) {
        const label = Number.parseInt(isoClass[index]);
        ++index;
        row.push(labelPerm.f(label));
      }
      rowPerm.suffle(row);
      square.grid.push(row);
    }
    columnPerm.suffle(square.grid);

    console.log(square.toString());
    return square;
  }

  public static randomOfSize(size: number) {
    const isoClass = this.randomIsotopyClass(size);
    return this.randomSquareFromIsotopyClass(isoClass);
  }

  public copy(): LatinSquare {
    const c = new LatinSquare();
    c.grid = this.grid.map(column => column.concat());
    return c;
  }

  public toString() {
    const lines = [];
    for (let i = 0; i < this.n; ++i) {
      lines.push(this.row(i).join(' '));
    }
    return lines.join('\n');
  }

  public static fromString(s: string) {
    const square = new LatinSquare();
    const grid = s.split('\n').map(row => row.split(' '));
    for (let i = 0; i < grid.length; ++i) {
      square.grid.push([]);
      for (let j = 0; j < grid.length; ++j) {
        square.grid[i].push(Number.parseInt(grid[j][i]));
      }
    }
    return square;
  }
}
