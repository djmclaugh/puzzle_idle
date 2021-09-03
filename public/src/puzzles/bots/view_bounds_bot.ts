import Bot from './bot.js'
import Towers, {HintFace, faceToString, isVertical, isReverse, isClockwise, next} from '../towers.js'

/**
 * Goes through all the hints one at a time.
 * It then calculates a lower and upper bound for each cell of that row/column.
 *
 * For example, if the grid size is 5 and there is a 3 hint. Then the first cell in that row/column
 * can't possibly be a 4.
 *
 * We calculate that bound naively. We assume the best case scenario. If we are looking at the i-th
 * cell, we assume that all previous cells are seen, including the i-th cell.
 * So there are (hint - i) cells still to be seen, so the i-th cell can't be more than size-(hint-i).
 * The i-th cell can't be more than size + i - hint.
 */

export default class ViewBoundsBot extends Bot {
  private p: Towers  // The puzzle being solved.

  private face: HintFace = HintFace.NORTH;
  private rowIndex: number = -1;
  private innerIndex: number = -1;
  private beat = -1;

  public logs: string[] = [];

  constructor(p: Towers) {
    super();
    this.p = p;
    this.logs.push('View Bounds Bot Initialized.')
  }

  public puzzleChanged() {
    // Is this needed?
  }

  public tick() {
    const n = this.p.n;
    const marks = this.p.marks;
    const isV = isVertical(this.face);
    const isR = isReverse(this.face);
    const isC = isClockwise(this.face);
    const hintIndex = isC ? this.rowIndex : n - this.rowIndex - 1;
    const hint = this.p.getHints(this.face)[hintIndex];

    const x = isV ? hintIndex : (isR ? n - this.innerIndex - 1 : this.innerIndex);
    const y = isV ? (isR ? n - this.innerIndex - 1 : this.innerIndex) : hintIndex;
    const max = 1 + n + this.innerIndex - hint;

    let didModify = false;

    if (this.beat == 1) {
      for (let i = max; i < n; ++i) {
        if (marks[x][y].has(i)) {
          this.logs.push(`Cell (${x + 1}, ${y + 1}) cannot be ${i + 1} because of the ${faceToString(this.face)} hint.`);
          marks[x][y].delete(i);
          didModify = true;
        }
      }
      this.innerIndex += 1;
      if (this.innerIndex >= n) {
        this.innerIndex = 0;
        this.rowIndex += 1;
      }
      if (this.rowIndex >= n) {
        this.rowIndex = 0;
        this.face = next(this.face);
        if (this.face == HintFace.NORTH) {
          this.logs.push('End of puzzle reached. Restarting Row Bot.')
          this.beat = 2;
        } else {
          this.logs.push(`Looking at the ${faceToString(this.face)} hints.`);
        }
      }
    } else if (this.beat == -1){
      this.logs.push(`Looking at the ${faceToString(HintFace.NORTH)} hints.`);
      this.face = HintFace.NORTH
      this.rowIndex = 0;
      this.innerIndex = 0;
      this.beat = 1;
    }
    this.beat = 1 - this.beat;

    return didModify;
  }
}
