import Process from '../../../process.js'
import Towers from '../../../../puzzles/towers/towers.js'
import {ContradictionType, RowContradiction, ColumnContradiction} from '../../../../puzzles/towers/towers_contradictions.js'
import { WAITING_MESSAGE } from '../../util.js'
import { ordinal } from '../util.js'

export default class LastCellLeftProcess extends Process<undefined> {
  public readonly processId: string;
  public readonly friendlyName: string;

  public readonly returnValue = undefined;

  public get ramRequirement(): number {
    return 0;
  }

  private currentIndex = 0;
  private lastIndex = -1;
  private remainingPossibilities: Set<number>;
  private step: "waiting"|"checking"|"setting"|"done" = "waiting";

  public get currentAction(): string {
    if (this.step == "waiting") {
      return WAITING_MESSAGE;
    } else if (this.step == "checking") {
      if (this.currentCell().size == 1) {
        return `${ordinal(this.currentIndex + 1)} cell set.`
      } else {
        return `${ordinal(this.currentIndex + 1)} cell NOT set.`
      }
    } else {
      if (this.lastIndex == -1) {
        return `All cells already set. Done!`;
      } else if (this.lastIndex == -2) {
        return `Multiple unset cells. Can't apply inference. Done!`;
      } else if (this.remainingPossibilities.size > 1) {
        return `Multiple remaining values. Contradiction!`;
      } else {
        return `${ordinal(this.lastIndex + 1)} cell must be ${this.remainingPossibilities.values().next().value + 1}. Done!`;
      }
    }
  }

  public constructor(private t: Towers, private index: number, private isRow: boolean, public interfaceId: number) {
    super();
    this.processId = `last_cell_left_${index}_${isRow}_${interfaceId}`;
    this.friendlyName = `Last cell in ${isRow ? 'row' : 'column'} ${index + 1}`;
    this.remainingPossibilities = new Set();
    for (let i = 0; i < t.n; ++i) {
      this.remainingPossibilities.add(i);
    }
  }

  private currentCell(): Set<number> {
    const row = this.isRow ? this.index : this.currentIndex;
    const col = !this.isRow ? this.index : this.currentIndex;
    return this.t.marks.getWithRowCol(row, col);
  }

  public tick(): boolean {
    if (this.step == "done") {
      return true;
    } else if (this.step == "waiting") {
      this.step = "checking";
      this.currentIndex = 0;
    } else if (this.step == "checking") {
      const p  = this.currentCell();
      if (p.size == 1) {
        this.remainingPossibilities.delete(p.values().next().value);
      } else {
        if (this.lastIndex == -1) {
          this.lastIndex = this.currentIndex
        } else {
          this.lastIndex = -2;
          this.step = "setting";
        }
      }
      this.currentIndex += 1;
      if (this.currentIndex >= this.t.n) {
        this.step = "setting";
      }
    } else if (this.step == "setting") {
      if (this.lastIndex >= 0) {
        if (this.remainingPossibilities.size == 1) {
          const row = this.isRow ? this.index : this.lastIndex;
          const col = !this.isRow ? this.index : this.lastIndex;
          console.log(row, col, this.remainingPossibilities.values().next().value);
          this.t.setCell(row, col, this.remainingPossibilities.values().next().value);
        } else {
          if (this.isRow) {
            const c: RowContradiction = {
              type: ContradictionType.ROW,
              noticedOnMove: this.t.history.length,
              row: this.index,
            }
            this.t.noticeContradiction(c);
          } else {
            const c: ColumnContradiction = {
              type: ContradictionType.COLUMN,
              noticedOnMove: this.t.history.length,
              col: this.index,
            }
            this.t.noticeContradiction(c);
          }
        }
      }
      this.step = "done";
      return true;
    }
    return false;
  }
}
