import Process from '../../../process.js'
import Towers from '../../../../puzzles/towers/towers.js'
import {HintFace, faceToString, isClockwise, isVertical, getCoordinates} from '../../../../puzzles/towers/hint_face.js'
import {ordinal} from '../util.js'

export default class SimpleViewProcess extends Process<void> {
  public readonly processId: string;
  public readonly friendlyName: string;
  public readonly interfaceId: number;
  public readonly returnValue: void = undefined;

  private actionMessage: string = 'Waiting for process to run...'
  public get currentAction(): string {
    return this.actionMessage;
  }

  private rowIndex: number = 0;
  private step: number = 0;
  private checkedHint = false;
  private hint: number = -1;
  private done: boolean = false;


  public constructor(
      private t: Towers,
      private face: HintFace,
      private withDepth: boolean,
      private withVisibility: boolean,
      private withMarkCompletedHints: boolean,
      private withTwosView: boolean,
      interfaceId: number) {
    super();
    this.friendlyName = `Initial ${faceToString(face)} Face Check`;
    this.interfaceId = interfaceId;
    this.processId = `simple_view_${faceToString(face).toLowerCase()}_${interfaceId}`;
  }

  private currentCoordinates(): [number, number] {
    const n = this.t.n;
    if (!isClockwise(this.face)) {
      return getCoordinates(this.face, n - this.rowIndex - 1, this.step, n);
    } else {
      return getCoordinates(this.face, this.rowIndex, this.step, n);
    }
  }

  public tick(): boolean {
    if (this.done) {
      return true;
    }
    if (this.rowIndex == this.t.n) {
      this.actionMessage = `Done!`;
      this.done = true;
      return false;
    }
    if (this.checkedHint == false) {
      const listName = isVertical(this.face) ? "column" : "row";
      this.actionMessage = `Checking ${listName} ${this.rowIndex + 1} out of ${this.t.n}`;
      this.hint = this.t.getHints(this.face)[this.rowIndex];
      this.checkedHint = true;
      return false;
    }
    if (this.hint == -1) {
      const listName = isVertical(this.face) ? "column" : "row";
      this.actionMessage = `No hint for this ${listName}.`;
      this.rowIndex += 1;
      this.checkedHint = false;
      this.step = 0;
      return false;
    }
    if (this.hint == 1) {
      this.actionMessage = `1st cell has to be ${this.t.n}.`;
      const [col, row] = this.currentCoordinates();
      this.t.setCell(row, col, this.t.n - 1);
      if (this.withMarkCompletedHints) {
        this.t.markHint(this.face, this.rowIndex);
      }
      this.rowIndex += 1;
      this.checkedHint = false;
      this.step = 0;
      return false;
    }
    if (this.hint == this.t.n) {
      this.actionMessage = `${ordinal(this.step + 1)} cell has to be ${this.step + 1}.`;
      const [col, row] = this.currentCoordinates();
      this.t.setCell(row, col, this.step);
      this.step += 1;
      if (this.step == this.t.n) {
        if (this.withMarkCompletedHints) {
          this.t.markHint(this.face, this.rowIndex);
        }
        this.rowIndex += 1;
        this.checkedHint = false;
        this.step = 0;
      }
      return false;
    }
    if (!this.withDepth && this.hint != 1) {
      this.actionMessage = `1st cell can't be ${this.t.n}.`;
      const [col, row] = this.currentCoordinates();
      this.t.removeFromCell(row, col, this.t.n - 1);
      this.rowIndex += 1;
      this.checkedHint = false;
      this.step = 0;
      return false;
    }
    // In any other case...
    const max = this.t.n - this.hint + this.step;
    const [col, row] = this.currentCoordinates();
    if (max < this.t.n - 1) {
      this.actionMessage = `${ordinal(this.step + 1)} cell can't be taller than ${1 + max}.`;
      for (let i = max + 1; i < this.t.n; ++i) {
        this.t.removeFromCell(row, col, i);
      }
    } else {
      this.actionMessage = `${ordinal(this.step + 1)} cell can be anything.`;
    }
    if (this.withVisibility) {
      for (let i = 0; i < this.step; ++i) {
        this.t.setTripleVisibility({row, col, val: i}, this.face, false);
      }
    }
    if (this.hint == 2 && this.withTwosView && this.step > 0) {
      for (let i = 0; i < this.t.n - 1; ++i) {
        this.t.setTripleVisibility({row, col, val: i}, this.face, false);
      }
    }
    this.step += 1;
    if (this.step == this.t.n) {
      this.rowIndex += 1;
      this.checkedHint = false;
      this.step = 0;
    }
    return false;
  }
}
