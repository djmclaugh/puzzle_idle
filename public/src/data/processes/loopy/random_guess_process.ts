import Process from '../../process.js'
import Loopy, { Action, Edge, EdgeType } from '../../../puzzles/loopy/loopy.js'

export default class RandomGuessProcess extends Process<Action> {
  public readonly processId: string;

  public get ramRequirement(): number {
    return 0;
  }

  private i = 0;
  private j = 0;
  private encounters: Edge[] = [];
  private choice: Action|undefined

  public get returnValue(): Action|undefined {
    return this.choice;
  }

  public beat: number = 0;

  public constructor(private p: Loopy, interfaceId: number) {
    super();
    this.processId = "random_selection_" + interfaceId;
  }

  public tick(): boolean {
    const n = this.p.n;
    if (this.beat == 0) {
      const hEdge = this.p.getHEdge(this.j, this.i);
      if (!hEdge.OFF && !hEdge.ON) {
        this.encounters.push({row: this.j, col: this.i, edgeType: EdgeType.Horizontal});
      }
      const vEdge = this.p.getVEdge(this.i, this.j);
      if (!vEdge.OFF && !vEdge.ON) {
        this.encounters.push({row: this.i, col: this.j, edgeType: EdgeType.Vertical});
      }
    } else {
      // Update indices
      this.j += 1;
      if (this.j > n) {
        this.j = 0;
        this.i += 1;
      }
      if (this.i >= n) {
        let index = Math.floor(Math.random() * this.encounters.length);
        let edge = this.encounters[index];
        if (Math.random() < 0.5) {
          this.p.guessEdgeON(edge.edgeType, edge.row, edge.col);
        } else {
          this.p.guessEdgeOFF(edge.edgeType, edge.row, edge.col);
        }
        return true;
      }
    }
    this.beat = 1 - this.beat;
    return false;
  }
}
