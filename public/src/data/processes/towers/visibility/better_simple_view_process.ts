import Process from '../../../process.js'
import Towers, {HintFace, faceToString, isReverse, isClockwise, isVertical, getCoordinates} from '../../../../puzzles/towers/towers.js'

export default class SimpleViewProcess extends Process<void> {
  public readonly processId: string;
  public readonly friendlyName: string;
  public readonly interfaceId: number;
  public readonly ramRequirement: number = 4;

  public rowIndex: number = 0;
  public depth: number = 0;
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
    if (this.rowIndex == this.t.n) {
      return 'Done!';
    }
    const listName = isVertical(this.face) ? "column" : "row";
    if (this.hint == -1) {
      return `Checking ${listName} ${this.rowIndex + 1} out of ${this.t.n}`;
    } else if (this.rowIndex == -1) {
      return `${listName} ${this.rowIndex + 1} has to see ${this.hint} towers`;
    } else if (this.hint == 1){
      return `First cell in ${listName} ${this.rowIndex + 1} has to be ${this.t.n}`;
    } else {
      return `Cell ${isReverse(this.face) ? this.t.n - this.depth : this.depth + 1} in ${listName} ${this.rowIndex + 1} can't be ${2 + this.t.n - this.hint + this.depth} or more`;
    }
  }

  private currentCoordinates(): [number, number] {
    const n = this.t.n;
    if (!isClockwise(this.face)) {
      return getCoordinates(this.face, n - this.rowIndex - 1, this.depth, n);
    } else {
      return getCoordinates(this.face, this.rowIndex, this.depth, n);
    }
  }

  public tick(): boolean {
    const n = this.t.n;
    if (this.rowIndex >= n) {
      return true;
    }
    if (this.hint == -1) {
      this.hint = this.t.getHints(this.face)[this.rowIndex];
      this.depth = 0;
      if (this.hint == -1) {
        this.rowIndex += 1;
      }
    } else if (this.hint == 1) {
      const [x, y] = this.currentCoordinates();
      this.t.setCell(y, x, n-1);
      this.rowIndex += 1;
      this.hint = -1;
    } else {
      const [x, y] = this.currentCoordinates();
      const max = n - this.hint + this.depth;
      for (let i = max + 1; i < n; ++i) {
        this.t.removeFromCell(y, x, i);
      }
      this.depth += 1;
      if (1 + n - this.hint + this.depth >= n) {
        this.rowIndex += 1;
        this.hint = -1;
      }
    }
    return this.rowIndex >= n;
  }
}
