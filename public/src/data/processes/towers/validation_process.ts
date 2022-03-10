import Process from '../../process.js'
import Towers from '../../../puzzles/towers/towers.js'
import {HintFace, next, faceToString, isClockwise, isVertical, getCoordinates} from '../../../puzzles/towers/hint_face.js'

export enum ValidationStep {
  NEW = 0,
  ROW = 1,
  COLUMN = 2,
  HINTS = 3,
  DONE = 4,
}

export default class ValidationProcess extends Process<boolean> {
  public readonly processId: string;
  public readonly friendlyName: string;
  public readonly ramRequirement: number = 4;

  public step: ValidationStep = ValidationStep.NEW;
  public index1: number = 0;
  public index2: number = 0;
  public index3: number = 0;
  public seenSoFar: number[] = [];
  public readonly size: number;

  public foundContradiction:boolean = false;

  public logs: string[][] = [];

  public beat: number = 0;
  private grid: number[][];

  private callbacks: (() => void)[] = [];

  public onTick(callback: () => void) {
    this.callbacks.push(callback);
  }

  private callCallbacks() {
    for (const c of this.callbacks) {
      c();
    }
  }

  public get currentAction(): string {
    return this.logs[this.logs.length - 1][0];
  }

  public get isDone(): boolean {
    return this.step == ValidationStep.DONE || this.foundContradiction;
  }

  public get returnValue(): boolean {
    return this.step == ValidationStep.DONE;
  }

  public constructor(private t: Towers, public interfaceId: number) {
    super();
    this.processId = "validation_" + interfaceId;
    this.friendlyName = `Validation`;
    this.grid = t.solvedGrid();
    this.size = this.grid.length;
    this.logs = [['Waiting for process to run...']]
  }

  public getBackgrounds(): {cell: [number, number], colour: string}[] {
    const grid = this.grid;
    const n = grid.length;
    const backgrounds: {cell: [number, number], colour: string}[] = [];
    if (this.step == ValidationStep.ROW) {
      const row = this.index1;
      const a = this.index2;
      const b = this.index3;
      let colour = '#ffffc0f0';

      if (this.beat == 1) {
        colour = grid[row][a] == grid[row][b] ? '#ffc0c0f0' : '#c0ffc0f0';
      }

      backgrounds.push({
        cell: [a, row],
        colour: colour,
      });
      backgrounds.push({
        cell: [b, row],
        colour: colour,
      });
    } else if (this.step == ValidationStep.COLUMN) {
      const column = this.index1;
      const a = this.index2;
      const b = this.index3;
      let colour = '#ffffc0f0';

      if (this.beat == 1) {
        colour = grid[a][column] == grid[b][column] ? '#ffc0c0f0' : '#c0ffc0f0';
      }

      backgrounds.push({
        cell: [column, a],
        colour: colour,
      });
      backgrounds.push({
        cell: [column, b],
        colour: colour,
      });
    } else if (this.step == ValidationStep.HINTS) {
      const face: HintFace = this.index1;
      const hintIndex = this.index2;
      const rowIndex = this.index3;
      const hints = this.t.getHints(face);
      if (!isClockwise(face)) {
        hints.reverse()
      }


      if (rowIndex < n) {
        const [x, y] = getCoordinates(face, hintIndex, rowIndex, n);
        let colour = '#ffffc0f0';
        if (this.beat == 0) {
          if (this.seenSoFar.indexOf(rowIndex) != -1) {
            colour = '#c0ffc0f0';
          } else {
            colour = '#c0c0a0f0';
          }
        }
        backgrounds.push({
          cell: [x, y],
          colour: colour,
        });
        this.seenSoFar.forEach(seen => {
          const [sX, sY] = getCoordinates(face, hintIndex, seen, n);
          backgrounds.push({
            cell: [sX, sY],
            colour: '#c0ffc0f0',
          })
        })
      } else {
        let colour = '#ffffc0f0';
        if (this.beat == 1) {
          if (this.seenSoFar.length == hints[hintIndex]) {
            colour = '#c0ffc0f0';
          } else {
            colour = '#ffc0c0f0';
          }
        }
        this.seenSoFar.forEach(seen => {
          const [sX, sY] = getCoordinates(face, hintIndex, seen, n);
          backgrounds.push({
            cell: [sX, sY],
            colour: colour,
          })
        })
      }
    }

    return backgrounds;
  }

  public tick(): boolean {
    if (this.foundContradiction) {
      this.callCallbacks();
      return true;
    }
    const grid = this.grid;
    const n = grid.length;
    switch (this.step) {
      case ValidationStep.NEW:
        this.step += 1;
        this.index1 = 0;
        this.index2 = 0;
        this.index3 = 1;
        this.logs[0] = [];
        this.logs[0].push(`Checking that no row has duplicates...`);
        this.logs[0].push(`-- Is ${grid[0][0] + 1} different from ${grid[0][1] + 1}?`);
        break;
      case ValidationStep.ROW: {
        const row = this.index1;
        const a = this.index2;
        const b = this.index3;
        if (this.beat == 0) {
          // Check if duplicate value
          const isDistinctCell = a != b;
          const isSameValue = this.grid[row][a] == this.grid[row][b];
          if (isDistinctCell && isSameValue) {
            this.logs[0].push('-- No ❌');
            this.foundContradiction = true;
          } else {
            this.logs[0].push(`-- Yes ✔️`);
          }
        } else {
          // Update indices
          this.index3 += 1;
          if (this.index3 >= n) {
            this.index2 += 1;
            this.index3 = this.index2 + 1;
          }
          if (this.index2 >= n - 1) {
            this.index1 += 1;
            this.index2 = 0;
            this.index3 = 1;
          }
          if (this.index1 >= n) {
            this.step += 1;
            this.index1 = 0;
            this.index2 = 0;
            this.index3 = 1;
            this.logs.push([]);
            this.logs[1].push(`Checking that no column has duplicates...`);
            this.logs[1].push(`-- Is ${grid[0][0] + 1} different from ${grid[1][0] + 1}?`);
          } else {
            this.logs[0].push(`-- Is ${grid[this.index1][this.index2] + 1} different from ${grid[this.index1][this.index3] + 1}?`);
          }
        }
        this.beat = 1 - this.beat;
        break;
      }
      case ValidationStep.COLUMN: {
        const column = this.index1;
        const a = this.index2;
        const b = this.index3;
        if (this.beat == 0) {
          // Check if duplicate value
          const isDistinctCell = a != b;
          const isSameValue = this.grid[a][column] == this.grid[b][column];
          if (isDistinctCell && isSameValue) {
            this.logs[1].push('-- No ❌');
            this.foundContradiction = true;
          } else {
            this.logs[1].push(`-- Yes ✔️`);
          }
        } else {
          // Update indices
          this.index3 += 1;
          if (this.index3 >= n) {
            this.index2 += 1;
            this.index3 = this.index2 + 1;
          }
          if (this.index2 >= n - 1) {
            this.index1 += 1;
            this.index2 = 0;
            this.index3 = 1;
          }
          if (this.index1 >= n) {
            this.step += 1;
            this.index1 = HintFace.NORTH;
            this.index2 = 0;
            this.index3 = 0;
            this.seenSoFar = [];
            this.logs.push([]);
            this.logs[2].push('Checking visibility hints...');
            this.logs[2].push(`- Checking ${faceToString(this.index1)} face...`);
            this.logs[2].push(`-- Checking column 1...`);
            this.logs[2].push(`--- Can the ${grid[0][0] + 1} tower be seen?`);
          } else {
            this.logs[1].push(`-- Is ${grid[this.index2][this.index1] + 1} different from ${grid[this.index3][this.index1] + 1}?`);
          }
        }
        this.beat = 1 - this.beat;
        break;
      }
      case ValidationStep.HINTS: {
        const face: HintFace = this.index1;
        const hintIndex = this.index2;
        const rowIndex = this.index3;
        const hints = this.t.getHints(face);
        if (!isClockwise(face)) {
          hints.reverse()
        }
        const [x, y] = getCoordinates(face, hintIndex, rowIndex, n);
        if (this.beat == 0) {
          // Check if seen / has hint / matches hint
          if (hints[hintIndex] == -1) {
            // No hints, so do nothing
            this.logs[2].push(`---- Doesn\'t matter, no hints to satisfy.`);
          } else if (rowIndex < n) {
            // Check if seen
            const value = this.grid[y][x];
            if (this.seenSoFar.length > 0) {
              const maxIndex = this.seenSoFar[this.seenSoFar.length - 1];
              const [maxX, maxY] = getCoordinates(face, hintIndex, maxIndex, n);
              const maxValue = this.grid[maxY][maxX];
              if (value > maxValue) {
                this.logs[2].push(`---- Yes`);
                this.seenSoFar.push(rowIndex);
              } else {
                this.logs[2].push(`---- No`);
              }
            } else {
              this.logs[2].push(`---- Yes`);
              this.seenSoFar.push(rowIndex);
            }
          } else {
            // Check if count matches
            if (hints[hintIndex] != this.seenSoFar.length) {
              this.logs[2].push(`---- No ❌`);
              this.foundContradiction = true;
            } else {
              this.logs[2].push(`---- Yes ✔️`);
            }
          }
        } else {
          // Update indices
          this.index3 += 1;
          if (this.index3 > n || hints[hintIndex] == -1) {
            this.index2 += 1;
            this.index3 = 0;
            this.seenSoFar = [];
          } else if (this.index3 == n) {
            this.logs[2].push(`--- Can exactly ${hints[hintIndex]} tower(s) be seen?`);
          } else {
            const [newX, newY] = getCoordinates(face, hintIndex, this.index3, n);
            this.logs[2].push(`--- Can the ${grid[newY][newX] + 1} tower be seen?`);
          }
          if (this.index2 >= n) {
            this.index1 = next(this.index1);
            this.index2 = 0;
            this.index3 = 0;
            this.seenSoFar = []
            if (this.index1 == HintFace.NORTH) {
              this.step += 1;
              this.logs.push(['Done!']);
              this.callCallbacks();
              return true;
            } else {
              this.logs[2].push(`- Checking ${faceToString(this.index1)} face...`);
              const isV = isVertical(this.index1);
              this.logs[2].push(`-- Checking ${isV ? 'Column' : 'Row'} ${this.index2 + 1}...`);
              const [newX, newY] = getCoordinates(this.index1, this.index2, this.index3, n);
              this.logs[2].push(`--- Can the ${grid[newY][newX] + 1} tower be seen?`);
            }
          } else if (this.index3 == 0) {
            const isV = isVertical(face);
            this.logs[2].push(`-- Checking ${isV ? 'Column' : 'Row'} ${this.index2 + 1}...`);
            const [newX, newY] = getCoordinates(face, this.index2, this.index3, n);
            this.logs[2].push(`--- Can the ${grid[newY][newX] + 1} tower be seen?`);
          }
        }
        this.beat = 1 - this.beat;
        break;
      }
      case ValidationStep.DONE:
        this.callCallbacks();
        return true;
    }
    this.callCallbacks();
    return this.foundContradiction;
  }
}
