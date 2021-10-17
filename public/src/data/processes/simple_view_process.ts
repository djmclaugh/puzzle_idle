import Process from '../process.js'
import Towers, {HintFace, faceToString, isClockwise, getCoordinates} from '../../puzzles/towers/towers.js'

export default class SimpleViewProcess extends Process<void> {
  public readonly processId: string;
  public readonly ramRequirement: number = 4;

  public rowIndex: number = 0;
  public valueToRemove: number = -1;
  private hint: number;
  public readonly returnValue: void = undefined;

  public beat: number = 0;

  public constructor(
      private t: Towers,
      private face: HintFace,
      private index: number,
      interfaceId: number) {
    super();
    const i = isClockwise(face) ? index : t.n - 1 - index;
    this.hint = t.getHints(face)[i];
    this.valueToRemove = t.n - 1;
    this.processId = `simple_view_${faceToString(face).toLowerCase()}_${index}_${interfaceId}`;
  }

  public tick(): boolean {
    const n = this.t.n;
    if (this.hint == -1) {
      return true;
    }
    if (this.beat == 0) {
      const [x, y] = getCoordinates(this.face, this.index, this.rowIndex, n);
      if (this.hint == 1) {
        // If the hint is one, then the nearest cell HAS to be the highest
        //possible value
        this.t.setCell(y, x, this.valueToRemove);
      } else {
        // Remove values that are too high
        this.t.removeFromCell(y, x, this.valueToRemove);
      }
    } else {
      // Update indices
      this.valueToRemove -= 1;
      if (this.valueToRemove <= n + this.rowIndex - this.hint) {
        this.valueToRemove = n - 1;
        this.rowIndex += 1;
      }
      if (this.rowIndex >= this.hint - 1) {
        return true;
      }
    }
    this.beat = 1 - this.beat;
    return false;
  }
}
