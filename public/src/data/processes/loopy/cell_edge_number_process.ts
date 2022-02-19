import Process from '../../process.js'
import Loopy, { EdgeState, EdgeType } from '../../../puzzles/loopy/loopy.js'
import Node from '../../../puzzles/loopy/node.js'

export default class CellEdgeNumberProcess extends Process<void> {
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

  public constructor(private p: Loopy, private row: number, private column: number, interfaceId: number) {
    super();
    this.edges = p.getEdgesForCell(row, column);
    this.processId = "cell_edge_number_" + row + "_" + column +"_" + interfaceId;
  }

  public tick(): boolean {
    if (this.p.getHint(this.row, this.column) === undefined) {
      // No hint in this cell, so no inferences to make.
      return true;
    }
    if (this.edges.find(e => e.ON && e.OFF) !== undefined) {
      // Already a contradiction, no need to make inferences.
      return true;
    }
    if (this.counts === undefined) {
      this.counts = [
        this.edges.filter(e => e.ON).length,
        this.edges.filter(e => e.OFF).length,
      ];
    } else {
      const hint = this.p.getHint(this.row, this.column)!;

      if (4 - this.counts[1] == hint) {
        // If 4 minus the number of OFF edges is equal to the hint, that means
        // that all other edges must be ON.
        if (!this.edges[0].OFF) {
          this.p.setEdgeON(EdgeType.Horizontal, this.row, this.column);
        }
        if (!this.edges[1].OFF) {
          this.p.setEdgeON(EdgeType.Vertical, this.row, this.column + 1);
        }
        if (!this.edges[2].OFF) {
          this.p.setEdgeON(EdgeType.Horizontal, this.row + 1, this.column);
        }
        if (!this.edges[3].OFF) {
          this.p.setEdgeON(EdgeType.Vertical, this.row, this.column);
        }
      }  else if (4 - this.counts[1] < hint) {
        this.p.noticeCellContradiction(this.row, this.column);
      }
      
      if (this.counts[0] == hint) {
        // If the number of ON edges is already equal to the hint, that means
        // that all other edges must be OFF.
        if (!this.edges[0].ON) {
          this.p.setEdgeOFF(EdgeType.Horizontal, this.row, this.column);
        }
        if (!this.edges[1].ON) {
          this.p.setEdgeOFF(EdgeType.Vertical, this.row, this.column + 1);
        }
        if (!this.edges[2].ON) {
          this.p.setEdgeOFF(EdgeType.Horizontal, this.row + 1, this.column);
        }
        if (!this.edges[3].ON) {
          this.p.setEdgeOFF(EdgeType.Vertical, this.row, this.column);
        }
      } else if (this.counts[0] > hint) {
        this.p.noticeCellContradiction(this.row, this.column);
      }

      return true;
    }
    return false;
  }
}
