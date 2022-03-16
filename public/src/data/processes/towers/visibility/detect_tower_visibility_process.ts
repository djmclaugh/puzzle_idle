import Process from '../../../process.js'
import Towers from '../../../../puzzles/towers/towers.js'
import { HintFace, faceToString, isClockwise, isVertical, isReverse, getCoordinates } from '../../../../puzzles/towers/hint_face.js'
import { ContradictionType } from '../../../../puzzles/towers/towers_contradictions.js'

export default class DetectTowerVisibilityProcess extends Process<void> {
  public readonly processId: string;
  public readonly friendlyName: string;
  public readonly interfaceId: number;
  public readonly ramRequirement: number = 4;

  private checkedHint = false;
  private hint: number = -1;
  private height: number = -1;
  private minEarliest: number = -1;
  private minLatest: number = -1;
  public readonly returnValue: void = undefined;
  private done: boolean = false;
  private actionMessage: string = 'Waiting for process to run...'

  public static processesForCell(puzzle: Towers, row: number, col: number, interfaceId: number, detectSeen: boolean, detectHidden: boolean): DetectTowerVisibilityProcess[] {
    return [
      new DetectTowerVisibilityProcess(puzzle, HintFace.NORTH, col, interfaceId, detectSeen, detectHidden),
      new DetectTowerVisibilityProcess(puzzle, HintFace.EAST, row, interfaceId, detectSeen, detectHidden),
      new DetectTowerVisibilityProcess(puzzle, HintFace.SOUTH, col, interfaceId, detectSeen, detectHidden),
      new DetectTowerVisibilityProcess(puzzle, HintFace.WEST, row, interfaceId, detectSeen, detectHidden),
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
      this.friendlyName = `Detect Hidden Towers - ${faceToString(face)} Face - ${listName} ${rowIndex + 1}`;
    } else if (!detectHidden) {
      this.friendlyName = `Detect Seen Towers - ${faceToString(face)} Face - ${listName} ${rowIndex + 1}`;
    } else {
      this.friendlyName = `Detect Tower Visibility - ${faceToString(face)} Face - ${listName} ${rowIndex + 1}`;
    }

    this.interfaceId = interfaceId;
    this.processId = `detect_tower_visibility_${detectSeen}_${detectHidden}_${faceToString(face).toLowerCase()}_${rowIndex}_${interfaceId}`;
  }

  public get currentAction(): string {
    return this.actionMessage;
  }

  private checkHintTick() {
    this.actionMessage = `Checking ${faceToString(this.face)} face hint`
    this.hint = this.t.getHints(this.face)[this.rowIndex];
    this.checkedHint = true;
    this.height = this.t.n - 1;
    this.minEarliest = this.t.n;
    this.minLatest = this.t.n;
  }

  private scanningTick() {
    if (this.height == -1) {
      this.actionMessage = "Done!";
      this.done = true;
      return;
    }
    let possibilities = isVertical(this.face) ?
        Array.from(this.t.marks.getWithColVal(this.rowIndex, this.height)) :
        Array.from(this.t.marks.getWithRowVal(this.rowIndex, this.height));
    if (isReverse(this.face)) {
      possibilities = possibilities.map(p => this.t.n - p - 1);
    }
    possibilities.sort();

    if (possibilities.length == 0) {
      this.t.noticeContradiction({
        type: ContradictionType.NO_POSSIBILITES,
        noticedOnMove: this.t.history.length,
        row: isVertical(this.face) ? undefined : this.rowIndex,
        col: isVertical(this.face) ? this.rowIndex : undefined,
        val: this.height,
      })
    }

    const min = possibilities[0];
    const max = possibilities[possibilities.length - 1];

    const hiddenForSure = min >= this.minLatest;
    const seenForSure = max <= this.minEarliest;
    if (this.detectSeen && this.detectHidden) {
      if (hiddenForSure && seenForSure)  {
        this.actionMessage = this.actionMessage = `Tower of heigth ${this.height + 1} hidden AND seen for sure: Contradiciton.`;
        this.t.setTowerVisibility(this.height, this.rowIndex, this.face, false);
        this.t.setTowerVisibility(this.height, this.rowIndex, this.face, true);
      } else if (hiddenForSure) {
        this.actionMessage = `Tower of heigth ${this.height + 1} hidden for sure.`;
        this.t.setTowerVisibility(this.height, this.rowIndex, this.face, false);
      } else if (seenForSure) {
        this.actionMessage = `Tower of heigth ${this.height + 1} seen for sure.`;
        this.t.setTowerVisibility(this.height, this.rowIndex, this.face, true);
      } else {
        this.actionMessage = `Visibility unknown for tower of heigth ${this.height + 1}.`;
      }
    } else if (this.detectSeen) {
      if (seenForSure) {
        this.actionMessage = `Tower of heigth ${this.height + 1} seen for sure.`;
        this.t.setTowerVisibility(this.height, this.rowIndex, this.face, true);
      } else {
        this.actionMessage = `Tower of heigth ${this.height + 1} might be hidden.`;
      }
    } else if (this.detectHidden) {
      if (hiddenForSure) {
        this.actionMessage = `Tower of heigth ${this.height + 1} hidden for sure.`;
        this.t.setTowerVisibility(this.height, this.rowIndex, this.face, false);
      } else {
        this.actionMessage = `Tower of heigth ${this.height + 1} might be seen.`;
      }
    } else {
      throw new Error('This should never happen, at least one of detectHidden or detectSeen should be true.');
    }

    this.minEarliest = Math.min(this.minEarliest, min);
    this.minLatest = Math.min(this.minLatest, max);

    this.height -= 1;
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
