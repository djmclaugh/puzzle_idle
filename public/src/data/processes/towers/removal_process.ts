import Process from '../../process.js'
import Towers from '../../../puzzles/towers/towers.js'

export default class RemovalProcess extends Process<void> {
  public readonly processId: string;
  public readonly ramRequirement: number = 4;

  public readonly returnValue: void = undefined;

  public beat: number = 0;

  public constructor(
      private t: Towers,
      private row: number,
      private column: number,
      private value: number,
      interfaceId: number) {
    super();
    this.processId = `remove_${row}_${column}_${value}_${interfaceId}`;
  }

  public tick(): boolean {
    if (this.beat == 0) {
      this.beat += 1;
      return false;
    } else if (this.beat == 1) {
      this.t.removeFromCell(this.row, this.column, this.value);
      this.beat += 1;
      return false;
    }
    return true;
  }
}
