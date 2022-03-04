import Process from '../../../process.js'
import Towers, {HintFace, faceToString, isClockwise, isVertical, getCoordinates} from '../../../../puzzles/towers/towers.js'

export default class OneViewProcess extends Process<void> {
  public readonly processId: string;
  public readonly friendlyName: string;
  public readonly interfaceId: number;
  public readonly ramRequirement: number = 4;

  public rowIndex: number = -1;
  private step: number = 0;
  public readonly returnValue: void = undefined;

  public constructor(
      private t: Towers,
      private face: HintFace,
      interfaceId: number) {
    super();
    this.friendlyName = `${faceToString(face)} Face Not 1 Check`;
    this.interfaceId = interfaceId;
    this.processId = `not_one_view_${faceToString(face).toLowerCase()}_${interfaceId}`;
  }

  public get currentAction(): string {
    if (this.rowIndex == -1) {
      return 'Waiting for process to run...';
    } else if (this.rowIndex < this.t.n) {
      const listName = isVertical(this.face) ? "column" : "row";
      if (this.step == 0) {
        return `Checking ${listName} ${this.rowIndex + 1} out of ${this.t.n}`;
      } else {
        return `${faceToString(this.face)}-most cell in ${listName} ${this.rowIndex + 1} CANNOT be ${this.t.n}`;
      }
    } else {
      return "Done!"
    }
  }

  private currentCoordinates(): [number, number] {
    const n = this.t.n;
    if (!isClockwise(this.face)) {
      return getCoordinates(this.face, n - this.rowIndex - 1, 0, n);
    } else {
      return getCoordinates(this.face, this.rowIndex, 0, n);
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
        if (this.t.getHints(this.face)[this.rowIndex] > 1) {
          this.step = 1;
        } else {
          this.rowIndex += 1;
        }
      } else {
        const [x, y] = this.currentCoordinates();
        this.t.removeFromCell(y, x, n-1);
        this.step = 0;
        this.rowIndex += 1;
      }
    }
    return false;
  }
}
