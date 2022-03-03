import Process from '../../process.js'
import Towers, {HintFace, faceToString, isClockwise, isVertical, getCoordinates} from '../../../puzzles/towers/towers.js'

function ordinal(n: number): string {
  if (n == 1) {
    return '1st';
  } else if (n == 2) {
    return '2nd';
  } else if (n == 3) {
    return '3rd';
  } else {
    return n + 'th';
  }
}

export default class PositionsSeenForSureProcess extends Process<void> {
  public readonly processId: string;
  public readonly friendlyName: string;
  public readonly interfaceId: number;
  public readonly ramRequirement: number = 4;

  private checkedHint = false;
  private hint: number = -1;
  private depth: number = 0;
  private doneScanning: boolean = false;
  private maxSeenSoFar: number = -1;
  private indicesSeenForSure: number[] = [];
  public readonly returnValue: void = undefined;
  private done: boolean = false;
  private actionMessage: string = 'Waiting for process to run...'

  public constructor(
      private t: Towers,
      private face: HintFace,
      private rowIndex: number,
      interfaceId: number) {
    super();
    const listName = isVertical(this.face) ? "Column" : "Row";
    this.friendlyName = `Positions Seen For Sure - ${faceToString(face)} Face - ${listName} ${rowIndex + 1}`;
    this.interfaceId = interfaceId;
    this.processId = `positions_seen_for_sure_check_${faceToString(face).toLowerCase()}_${rowIndex}_${interfaceId}`;
  }

  public get currentAction(): string {
    return this.actionMessage;
  }

  private currentCoordinates(): [number, number] {
    const n = this.t.n;
    if (!isClockwise(this.face)) {
      return getCoordinates(this.face, n - this.rowIndex - 1, this.depth, n);
    } else {
      return getCoordinates(this.face, this.rowIndex, this.depth, n);
    }
  }

  public tick(): boolean {
    const n = this.t.n;
    if (this.done) {
      return true;
    } else if (!this.checkedHint) {
      this.actionMessage = `Checking ${faceToString(this.face)} face hint`
      this.hint = this.t.getHints(this.face)[this.rowIndex];
      this.checkedHint = true;
    } else if (this.hint == -1) {
      this.actionMessage = `No hint, nothing to do. Done!`;
      this.done = true;
    } else if (!this.doneScanning) {
      if (this.depth < n) {
        const [col, row] = this.currentCoordinates();
        const possibilities = Array.from(this.t.marks.getWithRowCol(row, col)).sort();
        if (possibilities[0] >= this.maxSeenSoFar) {
          this.actionMessage = `${ordinal(this.depth + 1)} cell seen for sure.`;
          this.indicesSeenForSure.push(this.depth);
        } else {
          this.actionMessage = `${ordinal(this.depth + 1)} cell might be hidden.`;
        }
        this.maxSeenSoFar = Math.max(this.maxSeenSoFar, possibilities[possibilities.length - 1]);
        this.depth += 1;
      } else {
        this.actionMessage = `Total of ${this.indicesSeenForSure.length} cells seen for sure.`;
        this.depth = -1;
        this.doneScanning = true;
      }
    } else {
      if (this.depth == -1) {
        if (this.indicesSeenForSure.length > this.hint) {
          this.actionMessage = `Too many cells seen for sure: Contradiction!`;
          this.done = true;
          // TODO: notice contradiction
        } else if (this.indicesSeenForSure.length == this.hint) {
          this.actionMessage = `All other cells must be hidden.`;
          this.depth = 0;
          this.maxSeenSoFar = -1;
        } else {
          this.actionMessage = `Not enough information. Done.`;
          this.done = true;
        }
      } else {
        let [col, row] = this.currentCoordinates();
        if (this.depth != 0) {
          for (let i = this.maxSeenSoFar; i < n; ++i) {
            this.t.removeFromCell(row, col, i);
          }
          this.depth += 1;
        }
        while (this.depth < n && this.indicesSeenForSure.indexOf(this.depth) != -1) {
          [col, row] = this.currentCoordinates();
          const possibilities = Array.from(this.t.marks.getWithRowCol(row, col)).sort();
          this.maxSeenSoFar = Math.max(this.maxSeenSoFar, possibilities[possibilities.length - 1]);
          this.depth += 1;
        }
        if (this.depth < n) {
          this.actionMessage = `${ordinal(this.depth + 1)} cell can't be ${this.maxSeenSoFar + 1} or more.`;
        } else {
          this.actionMessage = "Done!";
          this.done = true;
        }
      }
    }
    return false;
  }
}
