import Process from '../process.js'
import Towers, {Possibilities} from '../../puzzles/towers/towers.js'

export default class OnlyChoiceInColumnProcess extends Process<void> {
  public readonly processId: string;
  /**
   * Need to keep track of current column.
   * Need to keep track if found value.
   */
  public get ramRequirement(): number {
    return 2;
  }

  public row: number = 0;
  public rowFound: number = -1;

  public returnValue: void = undefined;

  public beat: number = 0;

  /**
   * Checks if the provided row only has one cell that can be the provided value.
   * If so, set that cell to that value.
   */
  public constructor(private t: Towers, private col: number, private value: number, interfaceId: number) {
    super();
    this.processId = "only_choice_in_column_" + col + "_" + value +"_" + interfaceId;
  }

  public tick(): boolean {
    const n = this.t.n;
    if (this.beat == 0) {
      // Check if value is in this cells possibilities.
      const p: Possibilities = this.t.marksCell(this.row, this.col);
      if (p.has(this.value)) {
        if (this.rowFound == -1) {
          this.rowFound = this.row;
        } else {
          // Found two cells that can be the given value, no infference can be
          // made.
          return true;
        }
      }
    } else {
      // Update indices
      this.row += 1;
      if (this.row >= n) {
        // Reached the end of the column.
        if (this.rowFound != -1) {
          this.t.setCell(this.rowFound, this.col, this.value);
        }
        return true;
      }
    }
    this.beat = 1 - this.beat;
    return false;
  }
}
