import Process from '../../../process.js'
import Towers, {ContradictionType, ColumnContradiction} from '../../../../puzzles/towers/towers.js'

export default class RemoveFromColumnProcess extends Process<undefined> {
  public readonly processId: string;
  public readonly friendlyName: string;

  public readonly returnValue = undefined;

  public get ramRequirement(): number {
    return 0;
  }

  public currentIndex = -1;
  public beat: number = 0;

  public get currentAction(): string {
    if (this.beat == 0) {
      const next = this.currentIndex + 1;
      if (next == this.skip) {
        return `Skipping over cell (${this.col + 1}, ${next + 1})`;
      }
      if (next == this.t.n) {
        return `Done!`;
      }
      return `Checking if ${this.val + 1} is in cell (${this.col + 1}, ${next + 1}).`;
    } else {
      return `Removing ${this.val + 1} from cell (${this.col + 1}, ${this.currentIndex + 1}).`;
    }
  }

  public constructor(private t: Towers, private val: number, private col: number, private skip: number, public interfaceId: number) {
    super();
    this.processId = `remove_from_column_${val}_${col}_${skip}_${interfaceId}`;
    this.friendlyName = `Remove ${val + 1} from column ${col + 1} (skip row ${skip + 1})`;
  }

  public tick(): boolean {
    if (this.beat == 0 && this.currentIndex == this.t.n - 1) {
      return true;
    }
    if (this.t.getContradiction() !== null) {
      return true;
    }
    if (this.beat == 0) {
      this.currentIndex += 1;
      if (this.currentIndex == this.skip) {
        this.beat = 1;
      } else if (!this.t.marksCell(this.currentIndex, this.col).has(this.val)) {
        this.beat = 1;
      }
      if (this.currentIndex == this.t.n) {
        return true;
      }
    } else {
      const marks = this.t.marksCell(this.currentIndex, this.col);
      if (marks.has(this.val) && marks.size == 1) {
        const contradiction: ColumnContradiction = {
          noticedOnMove: 0,
          type: ContradictionType.COLUMN,
          col: this.col,
          row1: this.skip,
          row2: this.currentIndex,
        };
        this.t.noticeContradiction(contradiction);
        return true;
      } else {
        this.t.removeFromCell(this.currentIndex, this.col, this.val);
      }
    }
    this.beat = 1 - this.beat;
    return this.beat == 0 && this.currentIndex == this.t.n - 1;
  }
}
