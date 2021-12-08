import Process from '../../process.js'
import Towers from '../../../puzzles/towers/towers.js'

export default class AddUniquenessImplicationsProcess extends Process<void> {
  public readonly processId: string;
  public readonly ramRequirement: number = 4;

  public a: number = 0;
  public b: number = 0;
  public c: number = 0;
  public i: number = 0;
  public readonly returnValue: void = undefined;

  public constructor(private t: Towers, interfaceId: number) {
    super();
    this.processId = `add_uniqueness_implications_${interfaceId}`;
  }

  public tick(): boolean {
    const n = this.t.n;
    if (this.t.marksCell(this.a, this.b).has(this.c)) {
      const triple = {row: this.a, col: this.b, val: this.c};
      if (this.i != this.a && this.t.marksCell(this.i, this.b).has(this.c)) {
        this.t.addOnToOffImplication(triple, {row: this.i, col: this.b, val: this.c});
      }
      if (this.i != this.b && this.t.marksCell(this.a, this.i).has(this.c)) {
        this.t.addOnToOffImplication(triple, {row: this.a, col: this.i, val: this.c});
      }
      if (this.i != this.c && this.t.marksCell(this.a, this.b).has(this.i)) {
        this.t.addOnToOffImplication(triple, {row: this.a, col: this.b, val: this.i});
      }
    }
    // Update indices
    this.i += 1;
    if (this.i == n) {
      this.i = 0;
      this.c += 1;
    }
    if (this.c == n) {
      this.c = 0;
      this.b += 1;
    }
    if (this.b == n) {
      this.b = 0;
      this.a += 1;
    }
    if (this.a == n) {
      return true;
    }
    return false;
  }
}
