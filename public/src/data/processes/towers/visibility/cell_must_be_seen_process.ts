import Process from '../../../process.js'
import Towers from '../../../../puzzles/towers/towers.js'
import {HintFace, faceToString, isClockwise, isVertical, isReverse, getCoordinates} from '../../../../puzzles/towers/hint_face.js'
import { ordinal } from './util.js'

export default class CellMustBeSeenProcess extends Process<void> {
  public readonly processId: string;
  public readonly friendlyName: string;
  public readonly interfaceId: number;
  public readonly ramRequirement: number = 4;


  private depth: number = 0;
  private rowIndex: number = 0;

  private checkedMustBeSeen: boolean = false;
  private cellMax: number = -1;
  private largestMinSeenSoFar: number = -1;
  private checkDepth = 0;
  public readonly returnValue: void = undefined;
  private done: boolean = false;
  private actionMessage: string = 'Waiting for process to run...'

  public constructor(
      private t: Towers,
      private row: number,
      private col: number,
      private face: HintFace,
      interfaceId: number) {
    super();
    this.friendlyName = `Cell (${col + 1}, ${row + 1}) Must Be Seen - ${faceToString(face)} Face`;
    this.interfaceId = interfaceId;
    this.processId = `cell_must_be_seen_${row}_${col}_${faceToString(face).toLowerCase()}_${interfaceId}`;
    this.rowIndex = isVertical(face) ? col : row;
    this.depth = isVertical(face) ? row : col;
    if (isReverse(face)) {
      this.depth = t.n - this.depth - 1;
    }
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

  private currentCoordinates(): [number, number] {
    return this.coordinates(this.checkDepth);
  }

  public tick(): boolean {
    if (this.done) {
      return true;
    } else if (!this.checkedMustBeSeen) {
      if (this.t.getCellVisibility(this.row, this.col, this.face).seen) {
        this.actionMessage = `All possibilities marked as seen`;
      } else {
        this.actionMessage = `Cell potentially hidden. Inference does not apply. Done!`;
        this.done = true;
      }
      this.checkedMustBeSeen = true;
      return false;
    } else if (this.depth == 0) {
      this.actionMessage = `Cell is on the edge. It will be seen no matter what.`;
      this.done = true;
    } else if (this.cellMax == -1) {
      const possibilities = this.t.marks.getWithRowCol(this.row, this.col);
      if (possibilities.size == 0) {
        this.done = true;
        return true;
      }
      this.cellMax = Array.from(possibilities).sort()[possibilities.size - 1];
      this.actionMessage = `No cell in front of (${this.col + 1}, ${this.row + 1}) can be height ${this.cellMax + 1} or taller.`;
    } else {
      if (this.checkDepth > this.depth) {
        this.actionMessage = "Done!";
        this.done = true;
        return false;
      }
      let [col, row] = this.currentCoordinates();
      if (this.checkDepth == this.depth) {
        this.actionMessage = `${ordinal(this.checkDepth + 1)} cell can't be ${this.largestMinSeenSoFar + 1} or shorter.`
        for (let i = 0; i <= this.largestMinSeenSoFar; ++i) {
          this.t.removeFromCell(row, col, i);
        }
        this.checkDepth += 1;
      } else {
        this.actionMessage = `${ordinal(this.checkDepth + 1)} cell can't be ${this.cellMax + 1} or taller.`
        for (let i = this.cellMax; i < this.t.n; ++i) {
          this.t.removeFromCell(row, col, i);
        }
        const possibilities = this.t.marks.getWithRowCol(row, col);
        if (possibilities.size == 0) {
          this.done = true;
          return true;
        }
        const min = Array.from(possibilities).sort()[0];
        this.largestMinSeenSoFar = Math.max(this.largestMinSeenSoFar, min);
        this.checkDepth += 1;
      }
    }
    return false;
  }
}
