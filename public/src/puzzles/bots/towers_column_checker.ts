import Bot from './bot.js'
import Towers from '../towers.js'

/**
 * Goes through the whole grid until it finds a cell with only 1 option.
 * Once such a cell is found, goes through the whole column and removes that option from all the cells
 * of that column.
 */

export default class TowersColumnChecker extends Bot {
  private p: Towers  // The puzzle being solved.

  private row1: number = 0;
  private row2: number = 0;
  private column: number = 0;
  private currentTarget: number = -1;
  private beat = -1;

  public logs: string[] = [];

  constructor(p: Towers) {
    super();
    this.p = p;
    this.logs.push('Column Bot Initialized.')
  }

  public puzzleChanged() {
    // Is this needed?
  }

  public tick() {
    const n = this.p.n;
    const marks = this.p.marks;
    let didModify = false;

    if (this.beat == 1) {
      if (this.currentTarget == -1) {
        // Find the next solved cell.
        if (marks[this.column][this.row1].size == 1) {
          this.logs.push(`Found solved cells at position (${this.column + 1}, ${this.row1 + 1}).`)
          this.currentTarget = this.p.marks[this.column][this.row1].values().next().value;
          this.row2 = this.row1 == 0 ? 1 : 0;
        } else {
          this.row1 += 1;
          if (this.row1 >= n) {
            this.column += 1;
            this.row1 = 0;
            if (this.column != n) {
              this.logs.push(`Looking for solved cell in column ${this.column + 1}.`)
            }
          }
          if (this.column >= n) {
            this.logs.push('End of puzzle reached. Restarting Column Bot.')
            this.logs.splice(0, this.logs.length - 1);
            this.beat = 2;
            this.column = 0;
          }
        }
      } else {
        // Find cells in the same row that still has that option.
        if (marks[this.column][this.row2].has(this.currentTarget)) {
          this.logs.push(`Since cell (${this.column + 1}, ${this.row1 + 1}) must be value ${this.currentTarget + 1}, cell (${this.column + 1}, ${this.row2 + 1}) can't also be value ${this.currentTarget + 1} because both cells are in the same row.`);
          marks[this.column][this.row2].delete(this.currentTarget);
          didModify = true;
        }
        this.row2 += 1;
        if (this.row2 == this.row1) {
          this.row2 += 1;
        }
        if (this.row2 >= n) {
          this.logs.push(`Done removing '${this.currentTarget + 1}'s from column ${this.column + 1}.`);
          this.row2 = 0;
          this.row1 += 1;
          if (this.row1 >= n) {
            this.column += 1;
            this.row1 = 0;
            if (this.column != n) {
              this.logs.push(`Looking for solved cell in column ${this.column + 1}.`)
            }
          }
          if (this.column >= n) {
            this.logs.push('End of puzzle reached. Restarting Column Bot.')
            this.logs.splice(0, this.logs.length - 1);
            this.beat = 2;
            this.column = 0;
          }
          this.currentTarget = -1;
        }
      }
    } else if (this.beat == -1){
      this.logs.push('Looking for solved cell in column 1.');
      this.beat = 1;
    }
    this.beat = 1 - this.beat;

    return didModify;
  }
}
