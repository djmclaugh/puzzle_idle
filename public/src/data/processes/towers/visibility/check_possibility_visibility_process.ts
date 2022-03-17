import Process from '../../../process.js'
import Towers from '../../../../puzzles/towers/towers.js'
import { HintFace, faceToString, isClockwise, isVertical, getCoordinates } from '../../../../puzzles/towers/hint_face.js'
import { ContradictionType } from '../../../../puzzles/towers/towers_contradictions.js'
import { ordinal } from './util.js'

export default class CheckPossibilityVisibilityProcess extends Process<void> {
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

  public static processesForCell(puzzle: Towers, row: number, col: number, interfaceId: number): CheckPossibilityVisibilityProcess[] {
    return [
      new CheckPossibilityVisibilityProcess(puzzle, HintFace.NORTH, col, interfaceId),
      new CheckPossibilityVisibilityProcess(puzzle, HintFace.EAST, row, interfaceId),
      new CheckPossibilityVisibilityProcess(puzzle, HintFace.SOUTH, col, interfaceId),
      new CheckPossibilityVisibilityProcess(puzzle, HintFace.WEST, row, interfaceId),
    ];
  }

  public constructor(
      private t: Towers,
      private face: HintFace,
      private rowIndex: number,
      interfaceId: number) {
    super();
    const listName = isVertical(this.face) ? "Column" : "Row";
    this.friendlyName = `Check Visibility - ${faceToString(face)} Face - ${listName} ${rowIndex + 1}`;

    this.interfaceId = interfaceId;
    this.processId = `check_visibility_${faceToString(face).toLowerCase()}_${rowIndex}_${interfaceId}`;
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

      this.actionMessage = `Updating visibility for the ${ordinal(this.depth + 1)} cell.`;
      for (const p of possibilities) {
        if (p <= this.largestMinSeenSoFar) {
          this.t.setTripleVisibility({row, col, val: p}, this.face, false);
        }
        if (p >= this.maxSeenSoFar) {
          this.t.setTripleVisibility({row, col, val: p}, this.face, true);
        }
      }

      const min = possibilities[0];
      const max = possibilities[possibilities.length - 1];

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
