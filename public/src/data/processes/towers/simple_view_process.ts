import Process from '../../process.js'
import Towers, {HintFace, faceToString, isClockwise, isVertical, getCoordinates} from '../../../puzzles/towers/towers.js'

function ordinal(n: number): string {
  if (n == 1) {
    return '1st';
  } else if (n == 2) {
    return '2nd';
  } else if (n == 3) {
    return '3rd';
  } else {
    return n + 'th';
  }
}

export default class SimpleViewProcess extends Process<void> {
  public readonly processId: string;
  public readonly friendlyName: string;
  public readonly interfaceId: number;
  public readonly ramRequirement: number = 4;

  private rowIndex: number = 0;
  private step: number = 0;
  private hint: number = -1;
  public readonly returnValue: void = undefined;

  public constructor(
      private t: Towers,
      private face: HintFace,
      interfaceId: number) {
    super();
    this.friendlyName = `Simple ${faceToString(face)} Face Check`;
    this.interfaceId = interfaceId;
    this.processId = `simple_view_${faceToString(face).toLowerCase()}_${interfaceId}`;
  }

  public get currentAction(): string {
    if (this.rowIndex == -1) {
      return 'Waiting for process to run...';
    } else if (this.rowIndex < this.t.n) {
      const listName = isVertical(this.face) ? "column" : "row";
      if (this.step == 0) {
        return `Checking ${listName} ${this.rowIndex + 1} out of ${this.t.n}`;
      } else if (this.hint == this.t.n) {
        return `${ordinal(this.step)} cell has to be ${this.step}`;
      } else if (this.hint == 1) {
        return `${faceToString(this.face)}-most cell in ${listName} ${this.rowIndex + 1} has to be ${this.t.n}`
      } else {
        return `${faceToString(this.face)}-most cell in ${listName} ${this.rowIndex + 1} CANNOT be ${this.t.n}`
      }
    } else {
      return "Done!"
    }
  }

  private currentCoordinates(): [number, number] {
    const n = this.t.n;
    if (!isClockwise(this.face)) {
      return getCoordinates(this.face, n - this.rowIndex - 1, this.step - 1, n);
    } else {
      return getCoordinates(this.face, this.rowIndex, this.step - 1, n);
    }
  }

  public tick(): boolean {
    const n = this.t.n;
    if (this.rowIndex >= n) {
      return true;
    } else if (this.rowIndex == -1) {
      this.rowIndex = 0;
    } else {
      if (this.step == 0) {
        this.hint = this.t.getHints(this.face)[this.rowIndex];
        if (this.hint != -1) {
          this.step = 1;
        } else {
          this.rowIndex += 1;
        }
      } else {
        const [x, y] = this.currentCoordinates();
        if (this.hint == n) {
          this.t.setCell(y, x, this.step-1);
          this.step += 1;
          if (this.step > this.t.n) {
            this.step = 0
            this.rowIndex += 1;
          }
        } else if (this.hint == 1) {
          this.t.setCell(y, x, n-1);
          this.step = 0
          this.rowIndex += 1;
        } else {
          this.t.removeFromCell(y, x, n-1);
          this.step = 0
          this.rowIndex += 1;
        }
      }
    }
    return false;
  }
}
