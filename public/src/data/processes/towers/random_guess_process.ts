import Process from '../../process.js'
import { Triple } from '../../../puzzles/towers/triple_collection.js'
import Towers from '../../../puzzles/towers/towers.js'

export default class RandomGuessProcess extends Process<Triple> {
  public readonly processId: string;
  public readonly friendlyName: string;
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
  public choiceCountdown = -1;
  public encounters: Set<Triple> = new Set();
  public choice: Triple|undefined

  public get returnValue(): Triple|undefined {
    return this.choice;
  }

  public get currentAction(): string {
    if (this.choiceCountdown == -1) {
      return `Looking at possibilites in cell (${this.current.col + 1}, ${this.current.row + 1}).`;
    } else {
      return `Randomly choosing out of ${this.encounters.size} possibilities.`
    }
  }

  public beat: number = 0;

  public constructor(private t: Towers, public interfaceId: number) {
    super();
    this.processId = "random_selection_" + interfaceId;
    this.friendlyName = `Random Guess`;
  }

  public tick(): boolean {
    if (this.choice) {
      return true;
    }
    if (this.choiceCountdown != -1) {
      this.choiceCountdown += 1;
      if (this.choiceCountdown < this.encounters.size) {
        return false;
      } else {
        const l = Array.from(this.encounters);
        let index = Math.floor(Math.random() * l.length);
        this.choice = l[index];
        this.t.takeGuess(this.choice);
        return true;
      }
    }
    const n = this.t.n;
    if (this.beat == 0) {
      const p: Set<number> = this.t.marksCell(this.current.row, this.current.col);
      if (p.size > 1 && this.current.valIndex < p.size) {
        const possibilites = Array.from(p).sort();
        this.encounters.add({
            row: this.current.row,
            col: this.current.col,
            val: possibilites[this.current.valIndex],
        });
      } else {
        // Do nothing
      }
    } else {
      // Update indices
      let p: Set<number> = this.t.marksCell(this.current.row, this.current.col);
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
        this.choiceCountdown = 0;
      }
    }
    this.beat = 1 - this.beat;
    return false;
  }
}
