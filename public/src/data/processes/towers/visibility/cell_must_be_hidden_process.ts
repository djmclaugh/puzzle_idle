import Process from '../../../process.js'
import Towers from '../../../../puzzles/towers/towers.js'
import {HintFace, faceToString, isClockwise, isVertical, isReverse, getCoordinates} from '../../../../puzzles/towers/hint_face.js'
import {ContradictionType} from '../../../../puzzles/towers/towers_contradictions.js'
import { ordinal } from './util.js'

export default class CellMustBeHIddenProcess extends Process<void> {
  public readonly processId: string;
  public readonly friendlyName: string;
  public readonly interfaceId: number;
  public readonly ramRequirement: number = 4;


  private depth: number = 0;
  private rowIndex: number = 0;

  private cellMin: number = -1;
  private maxSeenSoFar: number = -1;
  private potentialCovers: number[] = [];
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
    this.friendlyName = `Cell (${col + 1}, ${row + 1}) Must Be Hidden - ${faceToString(face)} Face`;
    this.interfaceId = interfaceId;
    this.processId = `cell_must_be_hidden_${row}_${col}_${faceToString(face).toLowerCase()}_${interfaceId}`;
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

  private noticeContradiction() {
    this.t.noticeContradiction({
      type: ContradictionType.VIEW,
      noticedOnMove: this.t.history.length,
      face: this.face,
      rowIndex: this.rowIndex,
      cellIndices: [],
    })
  }

  public tick(): boolean {
    if (this.done) {
      return true;
    } else if (this.depth == 0) {
      this.actionMessage = `Cell is on the edge. It will be seen no matter what. Contradiction!`;
      this.noticeContradiction();
      this.done = true;
    } else if (this.cellMin == -1) {
      const possibilities = this.t.marks.getWithRowCol(this.row, this.col);
      if (possibilities.size == 0) {
        this.done = true;
        return true;
      }
      this.cellMin = Array.from(possibilities).sort()[0];
      this.actionMessage = `At least one cell in front of (${this.col + 1}, ${this.row + 1}) has to be taller than ${this.cellMin + 1}.`;
    } else {
      if (this.checkDepth == this.depth + 2) {
        this.actionMessage = "Done!";
        this.done = true;
        return false;
      }
      if (this.checkDepth == this.depth + 1) {
        if (this.potentialCovers.length == 0) {
          this.actionMessage = "No previous cell can be tall enough to cover. Contradiction!";
          this.noticeContradiction();
        } else if (this.potentialCovers.length > 1) {
          this.actionMessage = "More than one cell can be tall enough to cover.";
        } else {
          this.actionMessage = `Only ${ordinal(this.potentialCovers[0] + 1)} cell can be tall enough to cover. So it can't be ${this.cellMin + 1} or shorter.`;
          let [col, row] = this.coordinates(this.potentialCovers[0]);
          for (let i = 0; i <= this.cellMin; ++i) {
            this.t.removeFromCell(row, col, i);
          }
        }
        this.checkDepth += 1;
        return false;
      }
      let [col, row] = this.currentCoordinates();
      if (this.checkDepth == this.depth) {
        this.actionMessage = `${ordinal(this.checkDepth + 1)} cell can't be ${this.maxSeenSoFar + 1} or taller.`
        for (let i = this.maxSeenSoFar; i < this.t.n; ++i) {
          this.t.removeFromCell(row, col, i);
        }
        this.checkDepth += 1;
      } else {
        const possibilities = this.t.marks.getWithRowCol(row, col);
        if (possibilities.size == 0) {
          this.done = true;
          return true;
        }
        const ordered = Array.from(possibilities).sort();
        const min = ordered[0];
        const max = ordered[ordered.length - 1];
        this.maxSeenSoFar = Math.max(this.maxSeenSoFar, max);
        if (min > this.cellMin) {
          this.actionMessage = `${ordinal(this.checkDepth + 1)} cell will be taller than ${this.cellMin + 1}.`
          this.potentialCovers.push(this.checkDepth);
        } else  if (max > this.cellMin) {
          this.actionMessage = `${ordinal(this.checkDepth + 1)} cell could be taller than ${this.cellMin + 1}.`
          this.potentialCovers.push(this.checkDepth);
        } else {
          this.actionMessage = `${ordinal(this.checkDepth + 1)} cell can't be taller than ${this.cellMin + 1}.`
        }
        this.checkDepth += 1;
      }
    }
    return false;
  }
}
