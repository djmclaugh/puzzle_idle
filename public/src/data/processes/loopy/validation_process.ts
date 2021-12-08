import Process from '../../process.js'
import Loopy, { EdgeState } from '../../../puzzles/loopy/loopy.js'
import Node from '../../../puzzles/loopy/node.js'

export enum ValidationStep {
  NEW,
  HINTS,
  LOOP,
  UNIQUE,
  DONE,
}

export default class ValidationProcess extends Process<boolean> {
  public readonly processId: string;
  public readonly ramRequirement: number = 4;

  public step: ValidationStep = ValidationStep.NEW;

  // Hint phase
  public row: number = 0;
  public column: number = 0;
  public previousNode: Node|null = null;
  public currentNode: Node|null = null;
  public nodesFound: Set<number> = new Set();

  public logs: string[][] = [];

  public beat: number = 0;

  public get returnValue(): boolean {
    return this.step == ValidationStep.DONE;
  }

  public constructor(private p: Loopy, interfaceId: number) {
    super();
    this.processId = "validation_" + interfaceId;
  }

  public tick(): boolean {
    const n = this.p.n;
    switch (this.step) {
      case ValidationStep.NEW:
        this.step += 1;
        this.row = 0;
        this.column = 0;
        this.logs.push([]);
        this.logs[0].push(`Checking that each hint has the right amount of edges...`);
        this.logs[0].push(`-- Checking cell at row ${this.row}, column ${this.column}...`);
        break;
      case ValidationStep.HINTS: {
        if (this.beat == 0) {
          const hint = this.p.getHint(this.row, this.column);
          if (hint === undefined) {
            this.logs[0].push('-- No hint in that cell ✔️');
          } else {
            let numEdges = this.p.getEdgesForCell(this.row, this.column)
                                 .filter(s => s === EdgeState.ON)
                                 .length;
            if (numEdges == hint) {
              this.logs[0].push(`-- Cell touches exactly ${hint} edges ✔️`);
            } else {
              this.logs[0].push(`-- Cell touches ${numEdges} edges, not ${hint} ❌`);
              return true;
            }
          }
        } else {
          // Update indices
          this.column += 1;
          if (this.column >= n) {
            this.row += 1;
            this.column = 0;
          }
          if (this.row >= n) {
            this.step += 1
            this.column = 0;
            this.row = 0;
            this.currentNode = null;
            this.nodesFound = new Set();
            this.logs.push([]);
            this.logs[1].push(`Checking that edges make a closed loop...`);
            this.logs[1].push(`-- Finding a node on the loop...`);
            this.logs[1].push(`---- Checking if node on row ${this.row}, column ${this.column} is on the loop...`);
          } else {
            this.logs[0].push(`-- Checking cell at row ${this.row}, column ${this.column}...`);
          }
        }
        this.beat = 1 - this.beat;
        break;
      }
      case ValidationStep.LOOP: {
        if (this.beat == 0) {
          if (this.currentNode == null) {
            if (this.p.getEdgesForNode(this.row, this.column).indexOf(EdgeState.ON) == -1) {
              this.logs[1].push(`------ Not on loop.`);
            } else {
              this.currentNode = new Node(this.row, this.column);
              this.nodesFound.add(this.currentNode.hash());
              this.logs[1].push(`------ On loop!`);
              this.logs[1].push(`-- Checking if node on row ${this.currentNode.row}, column ${this.currentNode.column} touches exactly two edges...`);
              this.beat = 1 - this.beat;
            }
          } else {
            const edges = this.p.getEdgesForNode(this.currentNode.row, this.currentNode.column);
            const numEdges = edges.filter(s => s == EdgeState.ON).length;
            if (numEdges == 2) {
              this.logs[1].push(`---- Yes! ✔️`);
            } else {
              this.logs[1].push(`---- No, ${edges} edge(s) ❌`);
              return true;
            }
            if (this.previousNode == null) {
              if (edges[0] == EdgeState.ON) {
                this.previousNode = this.currentNode.up();
              } else if (edges[1] == EdgeState.ON) {
                this.previousNode = this.currentNode.right();
              } else if (edges[2] == EdgeState.ON) {
                this.previousNode = this.currentNode.down();
              } else if (edges[3] == EdgeState.ON) {
                this.previousNode = this.currentNode.left();
              }
            }
          }
        } else {
          if (this.currentNode == null) {
            this.column += 1;
            if (this.column > n) {
              this.column = 0;
              this.row += 1;
            }
            if (this.row > n) {
              // No nodes on path found...
              this.logs[1].push('------ No loop found ❌');
            } else {
              this.logs[1].push(`---- Checking if node on row ${this.row}, column ${this.column} is on the loop...`);
            }
          } else {
            const edges = this.p.getEdgesForNode(this.currentNode.row, this.currentNode.column);
            const hash = this.previousNode!.hash();
            this.previousNode = this.currentNode;
            if (edges[0] == EdgeState.ON && this.currentNode.up().hash() != hash) {
              this.currentNode = this.currentNode.up();
            } else if (edges[1] == EdgeState.ON && this.currentNode.right().hash() != hash) {
              this.currentNode = this.currentNode.right();
            } else if (edges[2] == EdgeState.ON && this.currentNode.down().hash() != hash) {
              this.currentNode = this.currentNode.down();
            } else if (edges[3] == EdgeState.ON && this.currentNode.left().hash() != hash) {
              this.currentNode = this.currentNode.left();
            } else {
              throw new Error("This should never happen");
            }
            const newHash = this.currentNode.hash();
            if (this.nodesFound.has(newHash)) {
              this.logs[1].push(`-- Loop completed ✔️`);
              this.column = 0;
              this.row = 0;
              this.logs.push([])
              this.logs[2].push('Checking that there are no other edges...')
              this.logs[2].push(`-- Checking if node at row ${this.row} and colunm ${this.column} is either on the loop or without edges...`);
            } else {
              this.nodesFound.add(newHash);
            }
          }
        }
        this.beat = 1 - this.beat;
        break;
      }
      case ValidationStep.UNIQUE: {
        if (this.beat == 0) {
          if (this.p.getEdgesForNode(this.row, this.column).indexOf(EdgeState.ON) != -1) {
            this.logs[2].push(`---- No edges ✔️`);
          } else if (this.nodesFound.has(new Node(this.row, this.column).hash())){
            this.logs[2].push(`---- On loop ✔️`);
          } else {
            this.logs[2].push(`---- Found edge not on loop ❌`);
            return true;
          }
        } else {
          this.column += 1;
          if (this.column > n) {
            this.column = 0;
            this.row += 1;
          }
          if (this.row > n) {
            // Done!
            this.step += 1;
            this.logs[2].push(`-- Loop contains all edges ✔️`);
          } else {
            this.logs[2].push(`-- Checking if node at row ${this.row} and colum ${this.column} is either on the loop or without edges...`);
          }
        }
        this.beat = 1 - this.beat;
        break;
      }

      case ValidationStep.DONE:
        return true;
    }
    return false;
  }
}
