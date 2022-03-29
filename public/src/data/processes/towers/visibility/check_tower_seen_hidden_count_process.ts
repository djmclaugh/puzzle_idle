import Process from '../../../process.js'
import Towers from '../../../../puzzles/towers/towers.js'
import { HintFace, faceToString, isVertical, isReverse } from '../../../../puzzles/towers/hint_face.js'
import { ContradictionType } from '../../../../puzzles/towers/towers_contradictions.js'
import {possibilitiesForTower, ordinal} from './util.js';

export default class CheckTowerSeenHiddenCountProcess extends Process<void> {
  public readonly processId: string;
  public readonly friendlyName: string;
  public readonly interfaceId: number;
  public readonly ramRequirement: number = 4;

  private checkedHint = false;
  private hint: number = -1;
  private height: number = 0;
  private towersSeenForSure: number[] = [];
  private potentiallySeenSpots: number[][];
  private towersHiddenForSure: number[] = [];
  private potentiallyHiddenSpots: number[][];
  private towersWithUnkownVisibility: number[] = [];
  private scanningDone = false;
  private shouldHideUnknown = false;
  public readonly returnValue: void = undefined;
  private done: boolean = false;
  private actionMessage: string = 'Waiting for process to run...'

  public static processesForCell(puzzle: Towers, row: number, col: number, withConflictingPositions:boolean, interfaceId: number): CheckTowerSeenHiddenCountProcess[] {
    return [
      new CheckTowerSeenHiddenCountProcess(puzzle, HintFace.NORTH, col, withConflictingPositions, interfaceId),
      new CheckTowerSeenHiddenCountProcess(puzzle, HintFace.EAST, row, withConflictingPositions, interfaceId),
      new CheckTowerSeenHiddenCountProcess(puzzle, HintFace.SOUTH, col, withConflictingPositions, interfaceId),
      new CheckTowerSeenHiddenCountProcess(puzzle, HintFace.WEST, row, withConflictingPositions, interfaceId),
    ];
  }

  // TODO:
  // - If only one more can be seen, putting a seen can't force another unkown to be seen.
  //   - if there are only two possibilities in a cell, setting one of those possibilites in another cell will force this cell. So setting a seen/hidden in another cell might force a seen/hidden in this cell.
  //   - if a tower only has two locations, setting another tower in one of those locations will force the other location. So setting a seen/hidden in one of the locations might force a seen/hidden in the other.

  public constructor(
      private t: Towers,
      private face: HintFace,
      private rowIndex: number,
      private withConflictingPositions: boolean,
      interfaceId: number) {
    super();
    const listName = isVertical(this.face) ? "Column" : "Row";
    this.friendlyName = `Check Tower Visibility Count - ${faceToString(face)} Face - ${listName} ${rowIndex + 1}`;

    this.interfaceId = interfaceId;
    this.processId = `check_tower_seen_hidden_count_${faceToString(face).toLowerCase()}_${rowIndex}_${interfaceId}`;

    this.potentiallySeenSpots = [];
    this.potentiallyHiddenSpots = [];
    for (let i = 0; i < t.n; ++i) {
      this.potentiallySeenSpots.push([]);
      this.potentiallyHiddenSpots.push([]);
    }
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

  private scanningTick() {
    const info = { seen: true, hidden: true };
    const possibilities = possibilitiesForTower(this.t.marks, this.height, this.rowIndex, this.face);
    for (const p of possibilities) {
      const possibilityInfo = this.t.visibility.getWithTriple(p)[this.face];
      info.seen = info.seen && possibilityInfo.seen;
      info.hidden = info.hidden && possibilityInfo.hidden;
      let order = isVertical(this.face) ? p.row : p.col;
      if (isReverse(this.face)) {
        order = this.t.n - order - 1;
      }
      if (!possibilityInfo.seen) {
        this.potentiallyHiddenSpots[p.val].push(order)
      }
      if (!possibilityInfo.hidden) {
        this.potentiallySeenSpots[p.val].push(order)
      }
    }

    if (info.seen && info.hidden) {
      this.noticeContradiction();
      return true;
    } else if (info.seen) {
      this.actionMessage = `Tower of height ${this.height + 1} seen for sure.`;
      this.towersSeenForSure.push(this.height);
    } else if (info.hidden) {
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
        if (this.withConflictingPositions) {
          let seenConflicts: number[][] = [];
          let largestConflict = 0;
          let cellWithLargestConflict = 0;
          for (let i = 0; i < this.t.n; ++i) {
            seenConflicts.push([]);
          }
          for (let i = 0; i < this.t.n; ++i) {
            if (this.potentiallySeenSpots[i].length == 1) {
              const cell = this.potentiallySeenSpots[i][0];
              seenConflicts[this.potentiallySeenSpots[i][0]].push(i);
              if (seenConflicts[cell].length > largestConflict) {
                largestConflict = seenConflicts[cell].length;
                cellWithLargestConflict = cell;
              }
            }
          }
          if (largestConflict > 1) {
            const extraHidden = largestConflict - 1;
            if (this.towersHiddenForSure.length + extraHidden > this.t.n - this.hint) {
              this.actionMessage = `Only one of ${seenConflicts[cellWithLargestConflict].map(x => x+1).toString()} can be seen in ${ordinal(cellWithLargestConflict + 1)} cell. So at least ${this.towersHiddenForSure.length + extraHidden} towers hidden for sure. Too many hidden!`;
              this.noticeContradiction();
              return true;
            } else if (this.towersHiddenForSure.length + extraHidden == this.t.n - this.hint) {
              this.actionMessage = `Only one of ${seenConflicts[cellWithLargestConflict].map(x => x+1).toString()} can be seen in ${ordinal(cellWithLargestConflict + 1)} cell. So at least ${this.towersHiddenForSure.length + extraHidden} towers hidden for sure. All other towers must be seen.`;
              this.shouldHideUnknown = false;
              this.towersWithUnkownVisibility = this.towersWithUnkownVisibility.filter(x => seenConflicts[cellWithLargestConflict].indexOf(x) == -1);
              this.height += 1;
              return false;
            }
          }

          let hiddenConflicts: number[][] = [];
          largestConflict = 0;
          cellWithLargestConflict = 0;
          for (let i = 0; i < this.t.n; ++i) {
            hiddenConflicts.push([]);
          }
          for (let i = 0; i < this.t.n; ++i) {
            if (this.potentiallyHiddenSpots[i].length == 1) {
              const cell = this.potentiallyHiddenSpots[i][0];
              hiddenConflicts[this.potentiallyHiddenSpots[i][0]].push(i);
              if (hiddenConflicts[cell].length > largestConflict) {
                largestConflict = hiddenConflicts[cell].length;
                cellWithLargestConflict = cell;
              }
            }
          }
          if (largestConflict > 1) {
            const extraSeen = largestConflict - 1;
            if (this.towersSeenForSure.length + extraSeen > this.hint) {
              this.actionMessage = `Only one of ${hiddenConflicts[cellWithLargestConflict].map(x => x+1).toString()} can be hidden in ${ordinal(cellWithLargestConflict + 1)} cell. So at least ${this.towersHiddenForSure.length + extraSeen} towers seen for sure. Too many seen!`;
              this.noticeContradiction();
              return true;
            } else if (this.towersSeenForSure.length + extraSeen == this.hint) {
              this.actionMessage = `Only one of ${hiddenConflicts[cellWithLargestConflict].map(x => x+1).toString()} can be hidden in ${ordinal(cellWithLargestConflict + 1)} cell. So at least ${this.towersHiddenForSure.length + extraSeen} towers seen for sure. All other towers must be hidden.`;
              this.shouldHideUnknown = true;
              this.towersWithUnkownVisibility = this.towersWithUnkownVisibility.filter(x => hiddenConflicts[cellWithLargestConflict].indexOf(x) == -1);
              this.height += 1;
              return false;
            }
          }
        }

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
