import Process from '../../../process.js'
import Towers from '../../../../puzzles/towers/towers.js'
import { HintFace, faceToString, isVertical } from '../../../../puzzles/towers/hint_face.js'
import { ContradictionType } from '../../../../puzzles/towers/towers_contradictions.js'
import {possibilitiesForTower} from './util.js';

export default class CheckTowerSeenHiddenCountProcess extends Process<void> {
  public readonly processId: string;
  public readonly friendlyName: string;
  public readonly interfaceId: number;
  public readonly ramRequirement: number = 4;

  private checkedHint = false;
  private hint: number = -1;
  private height: number = 0;
  private towersSeenForSure: number[] = [];
  private towersHiddenForSure: number[] = [];
  private towersWithUnkownVisibility: number[] = [];
  private scanningDone = false;
  private shouldHideUnknown = false;
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
    this.friendlyName = `Check Tower Visibility Count - ${faceToString(face)} Face - ${listName} ${rowIndex + 1}`;

    this.interfaceId = interfaceId;
    this.processId = `check_tower_seen_hidden_count_${faceToString(face).toLowerCase()}_${rowIndex}_${interfaceId}`;
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

  private checkHintTick() {
    this.actionMessage = `Checking ${faceToString(this.face)} face hint`
    this.hint = this.t.getHints(this.face)[this.rowIndex];
    this.checkedHint = true;
  }

  private towerVisibilityInfo(height: number) {
    const info = { seen: true, hidden: true };
    const possibilities = possibilitiesForTower(this.t.marks, height, this.rowIndex, this.face);
    for (const p of possibilities) {
      const possibilityInfo = this.t.visibility.getWithTriple(p)[this.face];
      info.seen = info.seen && possibilityInfo.seen;
      info.hidden = info.hidden && possibilityInfo.hidden;
    }
    return info;
  }

  private scanningTick() {
    const visibilityInfo = this.towerVisibilityInfo(this.height);
    if (visibilityInfo.seen && visibilityInfo.hidden) {
      this.noticeContradiction();
      return true;
    } else if (visibilityInfo.seen) {
      this.actionMessage = `Tower of height ${this.height + 1} seen for sure.`;
      this.towersSeenForSure.push(this.height);
    } else if (visibilityInfo.hidden) {
      this.actionMessage = `Tower of height ${this.height + 1} hidden for sure.`;
      this.towersHiddenForSure.push(this.height);
    } else {
      this.actionMessage = `Tower of height ${this.height + 1} could be seen or hidden.`;
      this.towersWithUnkownVisibility.push(this.height);
    }
    this.height += 1;
    if (this.height == this.t.n) {
      this.scanningDone = true;
      this.height = -2;
    }
  }

  private evaluationTick() {
    if (this.height == -2) {
      this.actionMessage = `${this.towersSeenForSure.length} towers seen for sure and ${this.towersHiddenForSure.length} towers hidden for sure.`;
      this.height += 1;
    } else if (this.height == -1) {
      if (this.towersSeenForSure.length > this.hint) {
        this.actionMessage = `Too many towers seen for sure: Contradiction.`;
        this.noticeContradiction();
        return true;
      } else if (this.towersHiddenForSure.length > this.t.n - this.hint) {
        this.actionMessage = `Too many towers hidden for sure: Contradiction.`;
        this.noticeContradiction();
        return true;
      } else if (this.towersWithUnkownVisibility.length == 0) {
        this.actionMessage = `No unknown visibility. Done!`;
        this.done = true;
      } else if (this.towersSeenForSure.length == this.hint) {
        this.actionMessage = `All other towers must be hidden.`;
        this.shouldHideUnknown = true;
      } else if (this.towersHiddenForSure.length == this.t.n - this.hint) {
        this.actionMessage = `All other towers must be seen.`;
        this.shouldHideUnknown = false;
      } else {
        this.actionMessage = `Not enough information. Done.`;
        this.done = true;
      }
      this.height += 1;
    } else if (this.towersWithUnkownVisibility.length > 0){
      this.height = this.towersWithUnkownVisibility.shift()!;
      if (this.shouldHideUnknown) {
        this.actionMessage = `Tower of height ${this.height + 1} must be hidden.`;
        this.t.setTowerVisibility(this.height, this.rowIndex, this.face, false);
      } else {
        this.actionMessage = `Tower of height ${this.height + 1} must be seen.`;
        this.t.setTowerVisibility(this.height, this.rowIndex, this.face, true);
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
