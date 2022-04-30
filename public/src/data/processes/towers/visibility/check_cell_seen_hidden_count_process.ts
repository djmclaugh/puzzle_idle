import Process from '../../../process.js'
import Towers from '../../../../puzzles/towers/towers.js'
import { HintFace, faceToString, isClockwise, isVertical, getCoordinates } from '../../../../puzzles/towers/hint_face.js'
import { ContradictionType } from '../../../../puzzles/towers/towers_contradictions.js'
import { ordinal } from '../util.js'

export default class CheckCellSeenHiddenCountProcess extends Process<void> {
  public readonly processId: string;
  public readonly friendlyName: string;
  public readonly interfaceId: number;
  public readonly ramRequirement: number = 4;

  private checkedHint = false;
  private hint: number = -1;
  private depth: number = 0;
  private indicesSeenForSure: number[] = [];
  private indicesHiddenForSure: number[] = [];
  private indicesWithUnkownVisibility: number[] = [];
  private scanningDone = false;
  private shouldHideUnknown = false;
  public readonly returnValue: void = undefined;
  private done: boolean = false;
  private actionMessage: string = 'Waiting for process to run...'

  public static processesForCell(puzzle: Towers, row: number, col: number, interfaceId: number): CheckCellSeenHiddenCountProcess[] {
    return [
      new CheckCellSeenHiddenCountProcess(puzzle, HintFace.NORTH, col, interfaceId),
      new CheckCellSeenHiddenCountProcess(puzzle, HintFace.EAST, row, interfaceId),
      new CheckCellSeenHiddenCountProcess(puzzle, HintFace.SOUTH, col, interfaceId),
      new CheckCellSeenHiddenCountProcess(puzzle, HintFace.WEST, row, interfaceId),
    ];
  }

  public constructor(
      private t: Towers,
      private face: HintFace,
      private rowIndex: number,
      interfaceId: number) {
    super();
    const listName = isVertical(this.face) ? "Column" : "Row";
    this.friendlyName = `Check Cell Visibility Count - ${faceToString(face)} Face - ${listName} ${rowIndex + 1}`;

    this.interfaceId = interfaceId;
    this.processId = `check_cell_seen_hidden_count_${faceToString(face).toLowerCase()}_${rowIndex}_${interfaceId}`;
  }

  public get currentAction(): string {
    return this.actionMessage;
  }

  private noticeContradiction() {
    this.t.noticeContradiction({
      type: ContradictionType.VIEW,
      noticedOnMove: this.t.history.length,
      face: this.face,
      rowIndex: this.rowIndex,
      cellIndices: [],
    });
    this.done = true;
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

  private cellVisibilityInfo(depth: number) {
    const info = { seen: true, hidden: true };
    const [col, row] = this.coordinates(depth);
    const possibilities = this.t.marks.getWithRowCol(row, col);
    for (const val of possibilities) {
      const possibilityInfo = this.t.visibility.getWithTriple({row, col, val})[this.face];
      info.seen = info.seen && possibilityInfo.seen;
      info.hidden = info.hidden && possibilityInfo.hidden;
    }
    return info;
  }

  private checkHintTick() {
    this.actionMessage = `Checking ${faceToString(this.face)} face hint`
    this.hint = this.t.getHints(this.face)[this.rowIndex];
    this.checkedHint = true;
  }

  private scanningTick() {
    const info = this.cellVisibilityInfo(this.depth);
    if (info.seen && info.hidden) {
      this.noticeContradiction();
      return true;
    } else if (info.seen) {
      this.actionMessage = `${ordinal(this.depth + 1)} cell seen for sure.`;
      this.indicesSeenForSure.push(this.depth);
    } else if (info.hidden) {
      this.actionMessage = `${ordinal(this.depth + 1)} cell hidden for sure.`;
      this.indicesHiddenForSure.push(this.depth);
    } else {
      this.actionMessage = `${ordinal(this.depth + 1)} cell could be seen or hidden.`;
      this.indicesWithUnkownVisibility.push(this.depth);
    }
    this.depth += 1;
    if (this.depth == this.t.n) {
      this.scanningDone = true;
      this.depth = -2;
    }
  }

  private evaluationTick() {
    if (this.depth == -2) {
      this.actionMessage = `${this.indicesSeenForSure.length} cells seen for sure and ${this.indicesHiddenForSure.length} cells hidden for sure.`;
      this.depth += 1;
    } else if (this.depth == -1) {
      if (this.indicesSeenForSure.length > this.hint) {
        this.actionMessage = `Too many cells seen for sure: Contradiction.`;
        this.noticeContradiction();
        return true;
      } else if (this.indicesHiddenForSure.length > this.t.n - this.hint) {
        this.actionMessage = `Too many cells hidden for sure: Contradiction.`;
        this.noticeContradiction();
        return true;
      } else if (this.indicesWithUnkownVisibility.length == 0) {
        this.actionMessage = `No unknown visibility. Done!`;
        this.done = true;
      } else if (this.indicesSeenForSure.length == this.hint) {
        this.actionMessage = `All other cells must be hidden.`;
        this.shouldHideUnknown = true;
      } else if (this.indicesHiddenForSure.length == this.t.n - this.hint) {
        this.actionMessage = `All other cells must be seen.`;
        this.shouldHideUnknown = false;
      } else {
        this.actionMessage = `Not enough information. Done.`;
        this.done = true;
      }
      this.depth += 1;
    } else if (this.indicesWithUnkownVisibility.length > 0){
      this.depth = this.indicesWithUnkownVisibility.shift()!;
      const [col, row] = this.currentCoordinates();
      if (this.shouldHideUnknown) {
        this.actionMessage = `${ordinal(this.depth + 1)} cell must be hidden.`;
        this.t.setCellVisibility(row, col, this.face, false);
      } else {
        this.actionMessage = `${ordinal(this.depth + 1)} cell must be seen.`;
        this.t.setCellVisibility(row, col, this.face, true);
      }
    } else {
      this.actionMessage = 'Done!';
      this.done = true;
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
    } else if (!this.scanningDone) {
      this.scanningTick();
    } else {
      this.evaluationTick();
    }
    return false;
  }
}
