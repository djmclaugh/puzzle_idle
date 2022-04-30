import Process from '../../../process.js'
import Towers from '../../../../puzzles/towers/towers.js'
import {HintFace, faceToString, isClockwise, isVertical, getCoordinates} from '../../../../puzzles/towers/hint_face.js'
import { ContradictionType } from '../../../../puzzles/towers/towers_contradictions.js'
import { ordinalPossibilitiesForTower } from './util.js'
import { ordinal } from '../util.js'

export default class TowerMustBeHidenProcess extends Process<void> {
  public readonly processId: string;
  public readonly friendlyName: string;
  public readonly interfaceId: number;
  public readonly ramRequirement: number = 4;

  private checkedMustBeHidden: boolean = false;
  private towerLatest: number = -1;
  private minEarliestSeenSoFar: number = -1;
  private potentialCovers: number[] = [];
  private checkHeight;
  public readonly returnValue: void = undefined;
  private done: boolean = false;
  private actionMessage: string = 'Waiting for process to run...'

  public constructor(
      private t: Towers,
      private height: number,
      private rowIndex: number,
      private face: HintFace,
      interfaceId: number) {
    super();
    const listName = isVertical(this.face) ? "Column" : "Row";
    this.friendlyName = `Tower of height ${height + 1} Must Be Hidden - ${faceToString(face)} Face - ${listName} ${rowIndex + 1}`;
    this.interfaceId = interfaceId;
    this.processId = `tower_must_be_hidden_${height}_${rowIndex}_${faceToString(face).toLowerCase()}_${interfaceId}`;
    this.checkHeight = t.n - 1;
    this.minEarliestSeenSoFar = t.n;
  }

  public get currentAction(): string {
    return this.actionMessage;
  }

  private coordinates(i: number): [number, number] {
    const n = this.t.n;
    if (!isClockwise(this.face)) {
      return getCoordinates(this.face, n - this.rowIndex - 1, i, n);
    } else {
      return getCoordinates(this.face, this.rowIndex, i, n);
    }
  }

  private noticeContradiction() {
    this.t.noticeContradiction({
      type: ContradictionType.VIEW,
      noticedOnMove: this.t.history.length,
      face: this.face,
      rowIndex: this.rowIndex,
      cellIndices: [],
    });
    this.done = true;
  }

  public tick(): boolean {
    if (this.done) {
      return true;
    } else if (!this.checkedMustBeHidden) {
      if (this.t.getTowerVisibility(this.height, this.rowIndex, this.face).hidden) {
        this.actionMessage = `All possibilities marked as hidden.`;
        this.checkedMustBeHidden = true;
      } else {
        this.actionMessage = `Height is potentially seen. Inference does not apply. Done!`;
        this.done = true;
      }
      this.checkedMustBeHidden = true;
      return false;
    } else if (this.height == this.t.n - 1) {
      this.actionMessage = `This is the tallest tower. It will be seen no matter what.`;
      this.noticeContradiction();
      return true;
    } else if (this.towerLatest == -1) {
      let possibilities = ordinalPossibilitiesForTower(this.t.marks, this.height, this.rowIndex, this.face);
      if (possibilities.length == 0) {
        this.t.noticeContradiction({
          type: ContradictionType.NO_POSSIBILITES,
          noticedOnMove: this.t.history.length,
          row: isVertical(this.face) ? undefined : this.rowIndex,
          col: isVertical(this.face) ? this.rowIndex : undefined,
          val: this.height,
        })
        this.done = true;
        return true;
      }
      this.towerLatest = possibilities[possibilities.length - 1];
      this.actionMessage = `At least one tower taller than ${this.height + 1} has to be before the ${ordinal(this.towerLatest + 1)} cell.`;
    } else {
      if (this.checkHeight == this.height - 2) {
        this.actionMessage = "Done!";
        this.done = true;
        return false;
      } else if (this.checkHeight == this.height - 1) {
        if (this.potentialCovers.length == 0) {
          this.actionMessage = "No taller tower can be early enough to cover. Contradiction!";
          this.noticeContradiction();
        } else if (this.potentialCovers.length > 1) {
          this.actionMessage = "More than one tower can be early enough to cover.";
        } else {
          this.actionMessage = `Only tower of height ${this.potentialCovers[0] + 1} can be early enough to cover. So it can't be at position ${ordinal(this.towerLatest + 1)} or later.`;
          for (let i = this.towerLatest; i < this.t.n; ++i) {
            let [col, row] = this.coordinates(i);
            this.t.removeFromCell(row, col, this.potentialCovers[0]);
          }
        }
        this.checkHeight -= 1;
      } else if (this.checkHeight == this.height) {
        this.actionMessage = `Tower of height ${this.checkHeight + 1} can't at or before the ${ordinal(this.minEarliestSeenSoFar + 1)} cell.`
        for (let i = 0; i <= this.minEarliestSeenSoFar; ++i) {
          const [col, row] = this.coordinates(i);
          this.t.removeFromCell(row, col, this.height);
        }
        this.checkHeight -= 1;
      } else {
        let possibilities = ordinalPossibilitiesForTower(this.t.marks, this.checkHeight, this.rowIndex, this.face);
        if (possibilities.length == 0) {
          this.noticeContradiction();
          return true;
        }
        const earliest = possibilities[0];
        const latest = possibilities[possibilities.length - 1];
        if (latest < this.towerLatest) {
          this.actionMessage = `Tower of height ${this.checkHeight + 1} will be in front of ${ordinal(this.towerLatest + 1)} cell.`;
          this.potentialCovers.push(this.checkHeight);
        } else if (earliest < this.towerLatest) {
          this.actionMessage = `Tower of height ${this.checkHeight + 1} could be in front of ${ordinal(this.towerLatest + 1)} cell.`;
          this.potentialCovers.push(this.checkHeight);
        } else {
          this.actionMessage = `Tower of height ${this.checkHeight + 1} can't be in front of ${ordinal(this.towerLatest + 1)} cell.`;
        }
        this.minEarliestSeenSoFar = Math.min(this.minEarliestSeenSoFar, earliest);
        this.checkHeight -= 1;
      }
    }
    return false;
  }
}
