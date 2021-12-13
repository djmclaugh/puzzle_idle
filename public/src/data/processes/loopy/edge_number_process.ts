import Process from '../../process.js'
import Loopy, { EdgeState, EdgeType } from '../../../puzzles/loopy/loopy.js'
import Node from '../../../puzzles/loopy/node.js'

export default class EdgeNumberProcess extends Process<void> {
  public readonly processId: string;
  /**
   * Need to keep track of current column.
   * Need to keep track if found value.
   */
  public get ramRequirement(): number {
    return 2;
  }

  public returnValue: void = undefined;

  public edges: EdgeState[];
  public counts: [number, number]|undefined;

  /**
   * Checks if the provided row only has one cell that can be the provided value.
   * If so, set that cell to that value.
   */
  public constructor(private p: Loopy, private node: Node, interfaceId: number) {
    super();
    this.edges = p.getEdgesForNode(node.row, node.column);
    this.processId = "edge_number_" + node.row + "_" + node.column +"_" + interfaceId;
  }

  public tick(): boolean {
    if (this.counts === undefined) {
      this.counts = [
        this.edges.filter(e => e.ON).length,
        this.edges.filter(e => e.OFF).length,
      ];
    } else {
      if (this.edges.find(e => e.ON && e.OFF) !== undefined) {
        // Already a contradiction, no need to make inferences.
        return true;
      }
      if (this.counts[0] == 2) {
        // If already two ON edges, the rest have to be off
        if (!this.edges[0].OFF && !this.edges[0].ON) {
          this.p.setEdgeOFF(EdgeType.Vertical, this.node.row - 1, this.node.column);
        }
        if (!this.edges[1].OFF && !this.edges[1].ON) {
          this.p.setEdgeOFF(EdgeType.Horizontal, this.node.row, this.node.column);
        }
        if (!this.edges[2].OFF && !this.edges[2].ON) {
          this.p.setEdgeOFF(EdgeType.Vertical, this.node.row, this.node.column);
        }
        if (!this.edges[3].OFF && !this.edges[3].ON) {
          this.p.setEdgeOFF(EdgeType.Horizontal, this.node.row, this.node.column - 1);
        }
      }
      if (this.counts[0] == 1 && this.counts[1] == 2) {
        // If there's one ON edge and two OFF edges, then we know the last edge
        // must be ON
        if (!this.edges[0].OFF && !this.edges[0].ON) {
          this.p.setEdgeON(EdgeType.Vertical, this.node.row - 1, this.node.column);
        }
        if (!this.edges[1].OFF && !this.edges[1].ON) {
          this.p.setEdgeON(EdgeType.Horizontal, this.node.row, this.node.column);
        }
        if (!this.edges[2].OFF && !this.edges[2].ON) {
          this.p.setEdgeON(EdgeType.Vertical, this.node.row, this.node.column);
        }
        if (!this.edges[3].OFF && !this.edges[3].ON) {
          this.p.setEdgeON(EdgeType.Horizontal, this.node.row, this.node.column - 1);
        }
      }
      if (this.counts[0] == 0 && this.counts[1] == 3) {
        // If there's no ON edges and three OFF edges, then we know the last
        // edge must be OFF
        if (!this.edges[0].OFF && !this.edges[0].ON) {
          this.p.setEdgeOFF(EdgeType.Vertical, this.node.row - 1, this.node.column);
        }
        if (!this.edges[1].OFF && !this.edges[1].ON) {
          this.p.setEdgeOFF(EdgeType.Horizontal, this.node.row, this.node.column);
        }
        if (!this.edges[2].OFF && !this.edges[2].ON) {
          this.p.setEdgeOFF(EdgeType.Vertical, this.node.row, this.node.column);
        }
        if (!this.edges[3].OFF && !this.edges[3].ON) {
          this.p.setEdgeOFF(EdgeType.Horizontal, this.node.row, this.node.column - 1);
        }
      }
      if (this.counts[0] >= 3) {
        // If there are more than two edges, then we have a contradiction.
        this.p.noticeNodeContradiction(this.node.row, this.node.column);
      }
      if (this.counts[0] == 1 && this.counts[1] == 3) {
        // If there is exactly one edge, then we have a contradiction.
        this.p.noticeNodeContradiction(this.node.row, this.node.column);
      }
      return true;
    }
    return false;
  }
}
