import Process from '../process.js'
import Towers, {Possibilities} from '../../puzzles/towers/towers.js'

export default class RandomSelectionProcess extends Process<void> {
  public readonly processId: string;
  public readonly ramRequirement: number = 4;

  public row: number = 0;
  public column: number = 0;
  public readonly returnValue: void = undefined;

  public beat: number = 0;

  public constructor(private t: Towers, interfaceId: number) {
    super();
    this.processId = "random_selection_" + interfaceId;
  }

  public tick(): boolean {
    const n = this.t.n;
    if (this.beat == 0) {
      // Make Random Selection
      const p: Possibilities = this.t.marksCell(this.row, this.column);
      const list = Array.from(p);
      const index = Math.floor(Math.random() * list.length);
      this.t.setCell(this.row, this.column, list[index]);

      if (this.row == n - 1 && this.column == n - 1) {
        return true;
      }
    } else {
      // Update indices
      this.column += 1;
      if (this.column >= n) {
        this.column = 0;
        this.row += 1;
      }
    }
    this.beat = 1 - this.beat;
    return false;
  }
}
