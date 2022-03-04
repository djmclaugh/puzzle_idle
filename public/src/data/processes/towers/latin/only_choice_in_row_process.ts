import Process from '../../../process.js'
import Towers from '../../../../puzzles/towers/towers.js'

export default class OnlyChoiceInRowProcess extends Process<void> {
  public readonly processId: string;
  public readonly friendlyName: string;
  public readonly interfaceId: number;
  public readonly ramRequirement: number = 4;

  public index: number = -1;
  private step: number = 0;
  private canBeIn: boolean = false;
  private found: number[] = [];
  public readonly returnValue: void = undefined;

  public constructor(
      private t: Towers,
      private row: number,
      private value: number,
      interfaceId: number) {
    super();
    this.friendlyName = `Check cells that can be ${value + 1} in row ${row + 1}`;
    this.interfaceId = interfaceId;
    this.processId = `only_choice_in_row_${value}_${row}_${interfaceId}`;
  }

  public get currentAction(): string {
    if (this.index == -1) {
      return 'Waiting for process to run...';
    } else if (this.index < this.t.n) {
      if (this.step == 0) {
        return `Checking if cell (${this.index + 1}, ${this.row + 1}) can be ${this.value + 1}`;
      } else if (this.canBeIn) {
        return `Cell (${this.index + 1}, ${this.row + 1}) CAN be ${this.value + 1}`;
      } else {
        return `Cell (${this.index + 1}, ${this.row + 1}) CANNOT be ${this.value + 1}`;
      }
    } else {
      if (this.step == 0) {
        if (this.found.length == 0) {
          return `Found no cells in row that can be ${this.value + 1}: contradiction!`;
        } else if (this.found.length == 1) {
          return `Only cell (${this.found[0] + 1}, ${this.row + 1}) can be ${this.value + 1}, so it must be ${this.value + 1}`;
        } else {
          return `Found multiple cells in column that can be ${this.value + 1}`;
        }
      }
      return "Done!"
    }
  }

  public tick(): boolean {
    const n = this.t.n;
    if (this.index >= n && this.step >= 1) {
      return true;
    } else if (this.index == -1) {
      this.index = 0;
    } else if (this.index < n) {
      if (this.step == 0) {
        const marks = this.t.marks.getWithRowCol(this.row, this.index);
        this.canBeIn = marks.has(this.value);
        if (this.canBeIn) {
          this.found.push(this.index);
        }
        this.step = 1;
      } else {
        this.step = 0;
        if (this.found.length > 1) {
          this.index = n;
        } else {
          this.index += 1;
        }
      }
    } else {
      if (this.step == 0) {
        if (this.found.length == 0) {
          // Notice contradiction
        } else if (this.found.length == 1){
          this.t.setCell(this.row, this.found[0], this.value);
        } else {
          // do nothing
        }
        this.step += 1;
      }
    }
    return false;
  }
}
