import Process from '../process.js'
import Towers, {Possibilities, Triple} from '../../puzzles/towers/towers.js'

export default class RandomRemovalProcess extends Process<Triple> {
  public readonly processId: string;
  /**
   *  3 bytes for current
   *  3 bytes for choice
   *  1 byte for encounters if size <= 6 (since a potential of at most 6^3 = 216 encounters)
   *  2 bytes for encounters if size > 6 (since a potential of at least 7^3 = 343 encounters)
   *  2 bytes for encounters is good for size at least 40.
   */
  public get ramRequirement(): number {
    return this.t.n <= 6 ? 7 : 8;
  }

  public current = {
    row: 0,
    col: 0,
    valIndex: 0,
  };
  public choice = {
    row: -1,
    col: -1,
    valIndex: -1,
  };;
  public encounters = 0;

  public get returnValue(): Triple|undefined {
    if (this.current.row >= this.t.n) {
      const p: Possibilities = this.t.marksCell(this.choice.row, this.choice.col);
      const sorted = Array.from(p).sort();
      return {
        row: this.choice.row,
        col: this.choice.col,
        val: sorted[this.choice.valIndex],
      }
    } else {
      return undefined;
    }
  }

  public beat: number = 0;

  public constructor(private t: Towers, interfaceId: number) {
    super();
    this.processId = "random_removal_" + interfaceId;
  }

  public tick(): boolean {
    const n = this.t.n;
    if (this.beat == 0) {
      // Update choice
      const p: Possibilities = this.t.marksCell(this.current.row, this.current.col);
      const sorted = Array.from(p).sort();
      if (sorted.length > 1) {
        this.encounters += 1;
        if (Math.random() < 1 / this.encounters) {
          Object.assign(this.choice, this.current);
        }
      } else {
        // Do nothing
      }
    } else {
      // Update indices
      let p: Possibilities = this.t.marksCell(this.current.row, this.current.col);
      this.current.valIndex += 1;
      if (this.current.valIndex >= p.size) {
        this.current.valIndex = 0;
        this.current.col += 1;
      }
      if (this.current.col >= n) {
        this.current.col = 0;
        this.current.row += 1;
      }
      if (this.current.row >= n) {
        p = this.t.marksCell(this.choice.row, this.choice.col);
        const sorted = Array.from(p).sort();
        this.t.removeFromCell(
          this.choice.row,
          this.choice.col,
          sorted[this.choice.valIndex]
        );
        return true;
      }
    }
    this.beat = 1 - this.beat;
    return false;
  }
}
