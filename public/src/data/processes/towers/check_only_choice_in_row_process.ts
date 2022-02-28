import Process from '../../process.js'
import Towers from '../../../puzzles/towers/towers.js'

export default class OnlyChoiceInRowProcess extends Process<void> {
  public readonly processId: string;
  public readonly friendlyName: string;
  public readonly interfaceId: number;
  /**
   * Need to keep track of current column.
   * Need to keep track if found value.
   */
  public get ramRequirement(): number {
    return 2;
  }

  public get currentAction(): string {
    return "TODO..."
  }

  public col: number = 0;
  public colFound: number = -1;

  public returnValue: void = undefined;

  public beat: number = 0;

  /**
   * Checks if the provided row only has one cell that can be the provided value.
   * If so, set that cell to that value.
   */
  public constructor(private t: Towers, private row: number, private value: number, interfaceId: number) {
    super();
    this.processId = "only_choice_in_row_" + row + "_" + value +"_" + interfaceId;
    this.friendlyName = "Only Choice in Row";
    this.interfaceId = interfaceId;
  }

  public tick(): boolean {
    const n = this.t.n;
    if (this.beat == 0) {
      // Check if value is in this cells possibilities.
      const p: Set<number> = this.t.marksCell(this.row, this.col);
      if (p.has(this.value)) {
        if (this.colFound == -1) {
          this.colFound = this.col;
        } else {
          // Found two cells that can be the given value, no infference can be
          // made.
          return true;
        }
      }
    } else {
      // Update indices
      this.col += 1;
      if (this.col >= n) {
        // Reached the end of the row.
        if (this.colFound != -1) {
          this.t.setCell(this.row, this.colFound, this.value);
        }
        return true;
      }
    }
    this.beat = 1 - this.beat;
    return false;
  }
}
