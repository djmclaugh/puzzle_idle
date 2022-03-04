import Process from '../../../process.js'
import Towers, {ContradictionType, RowContradiction} from '../../../../puzzles/towers/towers.js'

export default class RemoveFromRowProcess extends Process<undefined> {
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
        return `Skipping over cell (${next + 1}, ${this.row + 1})`;
      }
      if (next == this.t.n) {
        return `Done!`;
      }
      return `Checking if ${this.val + 1} is in cell (${next + 1}, ${this.row + 1}).`;
    } else {
      return `Removing ${this.val + 1} from cell (${this.currentIndex + 1}, ${this.row + 1}).`;
    }
  }

  public constructor(private t: Towers, private val: number, private row: number, private skip: number, public interfaceId: number) {
    super();
    this.processId = `remove_from_row_${val}_${row}_${skip}_${interfaceId}`;
    this.friendlyName = `Remove ${val + 1} from row ${row + 1} (skip column ${skip + 1})`;
  }

  public tick(): boolean {
    if (this.beat == 0 && this.currentIndex == this.t.n - 1) {
      return true;
    }
    if (this.beat == 0) {
      this.currentIndex += 1;
      if (this.currentIndex == this.skip) {
        this.beat = 1;
      } else if (!this.t.marksCell(this.row, this.currentIndex).has(this.val)) {
        this.beat = 1;
      }
      if (this.currentIndex == this.t.n) {
        return true;
      }
    } else {
      const marks = this.t.marksCell(this.row, this.currentIndex);
      if (marks.has(this.val) && marks.size == 1) {
        const contradiction: RowContradiction = {
          noticedOnMove: 0,
          type: ContradictionType.ROW,
          row: this.row,
          col1: this.skip,
          col2: this.currentIndex,
        };
        this.t.noticeContradiction(contradiction);
        return true;
      } else {
        this.t.removeFromCell(this.row, this.currentIndex, this.val);
      }
    }
    this.beat = 1 - this.beat;
    return this.beat == 0 && this.currentIndex == this.t.n - 1;
  }
}
