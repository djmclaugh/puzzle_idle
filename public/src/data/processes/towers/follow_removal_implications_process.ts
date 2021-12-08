import Process from '../../process.js'
import { Triple } from '../../../puzzles/towers/triple_collection.js'
import Towers from '../../../puzzles/towers/towers.js'

export default class FollowRemovalImplicationsProcess extends Process<void> {
  public readonly processId: string;

  public get ramRequirement(): number {
    return 2;
  }
  public returnValue: void = undefined;

  private toSet: Triple[] = [];
  private toRemove: Triple[] = [];
  private needsToCalculate: boolean = true;

  public constructor(private puzzle: Towers, private triple: Triple, interfaceId: number) {
    super();
    this.processId = "followRemoveImplications_" + JSON.stringify(triple) + "_" + interfaceId;
  }

  public tick(): boolean {
    // Only calculate the nodes to set/remove on the first tick because
    // otherwise we might have many nodes that have been set/removed between
    // the time the process was created and the first tick.
    if (this.needsToCalculate) {
      const implications = this.puzzle.implications.getImplicationsFromNodeRemoval(this.triple);
      implications[0].forEach(t => {
        if (this.puzzle.marks.getWithRowCol(t.row, t.col).size > 1 || !this.puzzle.marks.has(t)) {
          this.toSet.push(t);
        }
      });
      implications[1].forEach(t => {
        if (this.puzzle.marks.has(t)) {
          this.toRemove.push(t);
        }
      });
      this.needsToCalculate = false;
      return false;
    }
    if (this.toSet.length > 0) {
      const t: Triple = this.toSet.pop()!;
      this.puzzle.removeAllBut(t.row, t.col, t.val);
    } else if (this.toRemove.length > 0) {
      const t: Triple = this.toRemove.pop()!;
      this.puzzle.removeFromCell(t.row, t.col, t.val);
    } else {
      return true;
    }
    return false;
  }
}
