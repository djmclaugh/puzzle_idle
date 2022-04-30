import Process from '../../../process.js'
import Towers from '../../../../puzzles/towers/towers.js'
import {HintFace, faceToString, isClockwise, isVertical, getCoordinates} from '../../../../puzzles/towers/hint_face.js'
import { ContradictionType } from '../../../../puzzles/towers/towers_contradictions.js'
import { ordinalPossibilitiesForTower } from './util.js'
import { ordinal } from '../util.js'

export default class TowerMustBeSeenProcess extends Process<void> {
  public readonly processId: string;
  public readonly friendlyName: string;
  public readonly interfaceId: number;
  public readonly ramRequirement: number = 4;

  private checkedMustBeSeen: boolean = false;
  private towerEarliest: number = -1;
  private minLatestSeenSoFar: number = -1;
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
    this.friendlyName = `Tower of height ${height + 1} Must Be Seen - ${faceToString(face)} Face - ${listName} ${rowIndex + 1}`;
    this.interfaceId = interfaceId;
    this.processId = `tower_must_be_seen_${height}_${rowIndex}_${faceToString(face).toLowerCase()}_${interfaceId}`;
    this.checkHeight = t.n - 1;
    this.minLatestSeenSoFar = t.n;
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

  public tick(): boolean {
    if (this.done) {
      return true;
    } else if (!this.checkedMustBeSeen) {
      if (this.t.getTowerVisibility(this.height, this.rowIndex, this.face).seen) {
        this.actionMessage = `All possibilities marked as seen.`;
        this.checkedMustBeSeen = true;
      } else {
        this.actionMessage = `Height is potentially hidden. Inference does not apply. Done!`;
        this.done = true;
      }
      this.checkedMustBeSeen = true;
      return false;
    } else if (this.height == this.t.n - 1) {
      this.actionMessage = `This is the tallest tower. It will be seen no matter what.`;
      this.done = true;
    } else if (this.towerEarliest == -1) {
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
      this.towerEarliest = possibilities[0];
      this.actionMessage = `No tower taller than ${this.height + 1} can be at or before the ${ordinal(this.towerEarliest + 1)} cell.`;
    } else {
      if (this.checkHeight < this.height) {
        this.actionMessage = "Done!";
        this.done = true;
        return false;
      } else if (this.checkHeight == this.height) {
        this.actionMessage = `Tower of height ${this.checkHeight + 1} can't be at or after the ${ordinal(this.minLatestSeenSoFar + 1)} cell.`
        for (let i = this.minLatestSeenSoFar; i < this.t.n; ++i) {
          const [col, row] = this.coordinates(i);
          this.t.removeFromCell(row, col, this.height);
        }
        this.checkHeight -= 1;
      } else {
        this.actionMessage = `Tower of height ${this.checkHeight + 1} can't be at or before the ${ordinal(this.towerEarliest + 1)} cell.`;
        for (let i = 0; i <= this.towerEarliest; ++i) {
          const [col, row] = this.coordinates(i);
          this.t.removeFromCell(row, col, this.checkHeight);
        }
        let possibilities = ordinalPossibilitiesForTower(this.t.marks, this.checkHeight, this.rowIndex, this.face);
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
        const latest = possibilities[possibilities.length - 1];
        this.minLatestSeenSoFar = Math.min(this.minLatestSeenSoFar, latest);
        this.checkHeight -= 1;
      }
    }
    return false;
  }
}
