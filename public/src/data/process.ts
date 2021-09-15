import Towers, {Possibilities, HintFace, getCoordinates, next, isClockwise} from '../puzzles/towers/towers.js'

export default abstract class Process<R> {
  public readonly abstract processId: string;
  public readonly abstract ramRequirement: number;
  public readonly abstract returnValue: R;

  /**
   *  Returns true if and only if the process is over.
   */
  public abstract tick(): boolean;
}

export enum ValidationStep {
  NEW = 0,
  ROW = 1,
  COLUMN = 2,
  HINTS = 3,
  DONE = 4,
}

export class ValidationProcess extends Process<boolean> {
  public readonly processId: string;
  public readonly ramRequirement: number = 4;

  public step: ValidationStep = ValidationStep.NEW;
  public index1: number = 0;
  public index2: number = 0;
  public index3: number = 0;
  public seenSoFar: number[] = [];

  public beat: number = 0;
  private grid: number[][];

  public get returnValue(): boolean {
    return this.step == ValidationStep.DONE;
  }

  public constructor(private t: Towers, interfaceId: number) {
    super();
    this.processId = "validation_" + interfaceId;
    this.grid = t.marks.map((row: Possibilities[]) => {
      return row.map((cell: Possibilities) => {
        return cell.values().next().value;
      });
    });
  }

  public tick(): boolean {
    const n = this.grid.length;
    switch (this.step) {
      case ValidationStep.NEW:
        this.step += 1;
        this.index1 = 0;
        this.index2 = 0;
        this.index3 = 1;
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
            this.beat = 1 - this.beat;
            return true;
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
            this.index3 = 1
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
            this.beat = 1 - this.beat;
            return true;
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
          } else if (rowIndex < n) {
            // Check if seen
            const value = this.grid[y][x];
            if (this.seenSoFar.length > 0) {
              const maxIndex = this.seenSoFar[this.seenSoFar.length - 1];
              const [maxX, maxY] = getCoordinates(face, hintIndex, maxIndex, n);
              const maxValue = this.grid[maxY][maxX];
              if (value > maxValue) {
                this.seenSoFar.push(rowIndex);
              }
            } else {
              this.seenSoFar.push(rowIndex);
            }
          } else {
            // Check if count matches
            if (hints[hintIndex] != this.seenSoFar.length) {
              this.beat = 1 - this.beat;
              return true;
            }
          }
        } else {
          // Update indices
          this.index3 += 1;
          if (this.index3 > n || hints[hintIndex] == -1) {
            this.index2 += 1;
            this.index3 = 0;
            this.seenSoFar = [];
          }
          if (this.index2 >= n) {
            this.index1 = next(this.index1);
            this.index2 = 0;
            this.index3 = 0;
            this.seenSoFar = []
            if (this.index1 == HintFace.NORTH) {
              this.step += 1;
              return true;
            }
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
