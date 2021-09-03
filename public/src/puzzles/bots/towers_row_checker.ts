import Bot from './bot.js'
import Towers from '../towers/towers.js'

/**
 * Goes through the whole grid until it finds a cell with only 1 option.
 * Once such a cell is found, goes through the whole row and removes that option from all the cells
 * of that row.
 */

export default class TowersRowChecker extends Bot {
  private p: Towers  // The puzzle being solved.

  private row: number = 0;
  private column1: number = 0;
  private column2: number = 0;
  private currentTarget: number = -1;
  private beat = -1;

  constructor(p: Towers) {
    super();
    this.p = p;
    this.logs.push('Row Bot Initialized.')
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
        if (marks[this.row][this.column1].size == 1) {
          this.logs.push(`Found solved cells at position (${this.column1 + 1}, ${this.row + 1}).`)
          this.currentTarget = this.p.marks[this.row][this.column1].values().next().value;
          this.column2 = this.column1 == 0 ? 1 : 0;
        } else {
          this.column1 += 1;
          if (this.column1 >= n) {
            this.row += 1;
            this.column1 = 0;
            if (this.row != n) {
              this.logs.push(`Looking for solved cell in row ${this.row + 1}.`)
            }
          }
          if (this.row >= n) {
            this.logs.push('End of puzzle reached. Restarting Row Bot.')
            this.logs.splice(0, this.logs.length - 1);
            this.beat = 2;
            this.row = 0;
          }
        }
      } else {
        // Find cells in the same row that still has that option.
        if (marks[this.row][this.column2].has(this.currentTarget)) {
          this.logs.push(`Since cell (${this.column1 + 1}, ${this.row + 1}) must be value ${this.currentTarget + 1}, cell (${this.column2 + 1}, ${this.row + 1}) can't also be value ${this.currentTarget + 1} because both cells are in the same row.`);
          marks[this.row][this.column2].delete(this.currentTarget);
          didModify = true;
        }
        this.column2 += 1;
        if (this.column2 == this.column1) {
          this.column2 += 1;
        }
        if (this.column2 >= n) {
          this.logs.push(`Done removing '${this.currentTarget + 1}'s from row ${this.row + 1}.`);
          this.column2 = 0;
          this.column1 += 1;
          if (this.column1 >= n) {
            this.row += 1;
            this.column1 = 0;
            if (this.row != n) {
              this.logs.push(`Looking for solved cell in row ${this.row + 1}.`)
            }
          }
          if (this.row >= n) {
            this.logs.push('End of puzzle reached. Restarting Row Bot.')
            this.logs.splice(0, this.logs.length - 1);
            this.beat = 2;
            this.row = 0;
          }
          this.currentTarget = -1;
        }
      }
    } else if (this.beat == -1){
      this.logs.push('Looking for solved cell in row 1.');
      this.beat = 1;
    }
    this.beat = 1 - this.beat;

    return didModify;
  }
}
