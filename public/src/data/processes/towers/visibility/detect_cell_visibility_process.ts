import Process from '../../../process.js'
import Towers from '../../../../puzzles/towers/towers.js'
import { HintFace, faceToString, isClockwise, isVertical, getCoordinates } from '../../../../puzzles/towers/hint_face.js'
import { ContradictionType } from '../../../../puzzles/towers/towers_contradictions.js'
import { ordinal } from './util.js'

export default class DetectCellVisibilityProcess extends Process<void> {
  public readonly processId: string;
  public readonly friendlyName: string;
  public readonly interfaceId: number;
  public readonly ramRequirement: number = 4;

  private checkedHint = false;
  private hint: number = -1;
  private depth: number = 0;
  private maxSeenSoFar: number = -1;
  private largestMinSeenSoFar: number = -1;
  public readonly returnValue: void = undefined;
  private done: boolean = false;
  private actionMessage: string = 'Waiting for process to run...'

  public static processesForCell(puzzle: Towers, row: number, col: number, interfaceId: number, detectSeen: boolean, detectHidden: boolean): DetectCellVisibilityProcess[] {
    return [
      new DetectCellVisibilityProcess(puzzle, HintFace.NORTH, col, interfaceId, detectSeen, detectHidden),
      new DetectCellVisibilityProcess(puzzle, HintFace.EAST, row, interfaceId, detectSeen, detectHidden),
      new DetectCellVisibilityProcess(puzzle, HintFace.SOUTH, col, interfaceId, detectSeen, detectHidden),
      new DetectCellVisibilityProcess(puzzle, HintFace.WEST, row, interfaceId, detectSeen, detectHidden),
    ];
  }

  public constructor(
      private t: Towers,
      private face: HintFace,
      private rowIndex: number,
      interfaceId: number,
      private detectSeen: boolean,
      private detectHidden: boolean) {
    super();
    const listName = isVertical(this.face) ? "Column" : "Row";
    if (!detectSeen) {
      this.friendlyName = `Detect Hidden Cells - ${faceToString(face)} Face - ${listName} ${rowIndex + 1}`;
    } else if (!detectHidden) {
      this.friendlyName = `Detect Seen Cells - ${faceToString(face)} Face - ${listName} ${rowIndex + 1}`;
    } else {
      this.friendlyName = `Detect Cell Visibility - ${faceToString(face)} Face - ${listName} ${rowIndex + 1}`;
    }

    this.interfaceId = interfaceId;
    this.processId = `detect_hidden_cells_${detectSeen}_${detectHidden}_${faceToString(face).toLowerCase()}_${rowIndex}_${interfaceId}`;
  }

  public get currentAction(): string {
    return this.actionMessage;
  }

  private coordinates(i: number): [number, number] {
    const n = this.t.n;
    if (!isClockwise(this.face)) {
      return getCoordinates(this.face, n - this.rowIndex - 1, i, n);
    } else {
      return getCoordinates(this.face, this.rowIndex, i, n);
    }
  }

  private currentCoordinates(): [number, number] {
    return this.coordinates(this.depth);
  }

  private checkHintTick() {
    this.actionMessage = `Checking ${faceToString(this.face)} face hint`
    this.hint = this.t.getHints(this.face)[this.rowIndex];
    this.checkedHint = true;
  }

  private scanningTick() {
    if (this.depth == this.t.n) {
      this.actionMessage = "Done!";
      this.done = true;
    } else {
      const [col, row] = this.currentCoordinates();
      const possibilities = Array.from(this.t.marks.getWithRowCol(row, col)).sort();
      if (possibilities.length == 0) {
        this.t.noticeContradiction({
          type: ContradictionType.NO_POSSIBILITES,
          noticedOnMove: this.t.history.length,
          row: row,
          col: col,
        })
        return;
      }
      const min = possibilities[0];
      const max = possibilities[possibilities.length - 1];
      let hiddenForSure = false;
      let seenForSure = false;
      if (max <= this.largestMinSeenSoFar) {
        hiddenForSure = true;
      }
      if (min >= this.maxSeenSoFar) {
        seenForSure = true;
      }

      if (this.detectSeen && this.detectHidden) {
        if (hiddenForSure && seenForSure)  {
          this.actionMessage = `${ordinal(this.depth + 1)} cell hidden AND seen for sure: Contradiction.`;
          this.t.setCellVisibility(row, col, this.face, false);
          this.t.setCellVisibility(row, col, this.face, true);
        } else if (hiddenForSure) {
          this.actionMessage = `${ordinal(this.depth + 1)} cell hidden for sure.`;
          this.t.setCellVisibility(row, col, this.face, false);
        } else if (seenForSure) {
          this.actionMessage = `${ordinal(this.depth + 1)} cell seen for sure.`;
          this.t.setCellVisibility(row, col, this.face, true);
        } else {
          this.actionMessage = `${ordinal(this.depth + 1)} cell visibility unknown.`;
        }
      } else if (this.detectSeen) {
        if (seenForSure) {
          this.actionMessage = `${ordinal(this.depth + 1)} cell seen for sure.`;
          this.t.setCellVisibility(row, col, this.face, true);
        } else {
          this.actionMessage = `${ordinal(this.depth + 1)} cell could be hidden.`;
        }
      } else if (this.detectHidden) {
        if (seenForSure) {
          this.actionMessage = `${ordinal(this.depth + 1)} cell hidden for sure.`;
          this.t.setCellVisibility(row, col, this.face, false);
        } else {
          this.actionMessage = `${ordinal(this.depth + 1)} cell could be seen.`;
        }
      } else {
        throw new Error('This should never happen, at least one of detectHidden or detectSeen should be true.');
      }

      this.maxSeenSoFar = Math.max(this.maxSeenSoFar, max);
      this.largestMinSeenSoFar = Math.max(this.largestMinSeenSoFar, min);
      this.depth += 1;
    }
  }

public tick(): boolean {
    if (this.done) {
      return true;
    } else if (!this.checkedHint) {
      this.checkHintTick();
    } else if (this.hint == -1) {
      this.actionMessage = `No hint so visibility info is not useful. Done!`;
      this.done = true;
    } else {
      this.scanningTick();
    }
    return false;
  }
}
