import Process from '../../../process.js'
import Towers from '../../../../puzzles/towers/towers.js'
import {HintFace, faceToString, isClockwise, isVertical, getCoordinates} from '../../../../puzzles/towers/hint_face.js'
import {ContradictionType} from '../../../../puzzles/towers/towers_contradictions.js'

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

export class PositionsSeenHiddenForSureProcess extends Process<void> {
  public readonly processId: string;
  public readonly friendlyName: string;
  public readonly interfaceId: number;
  public readonly ramRequirement: number = 4;

  private checkedHint = false;
  private hint: number = -1;
  private depth: number = 0;
  private doneScanning: boolean = false;
  private maxSeenSoFar: number = -1;
  private largestMinSeenSoFar: number = -1;
  private indicesSeenForSure: number[] = [];
  private indicesHiddenForSure: number[] = [];
  private indicesWithUnkownVisibility: number[] = [];
  private shouldHideUnknown: boolean = false;
  private step: 'find_next'|'remove'|'check_in_front'|'remove_in_front' = 'find_next';
  private minOfCurrentCell = -1;
  private maxOfCurrentCell = -1;
  private checkDepth = -1;
  private covers: number[] = [];
  public readonly returnValue: void = undefined;
  private done: boolean = false;
  private actionMessage: string = 'Waiting for process to run...'

  public static processesForCell(puzzle: Towers, row: number, col: number, interfaceId: number): PositionsSeenHiddenForSureProcess[] {
    return [
      new PositionsSeenHiddenForSureProcess(puzzle, HintFace.NORTH, col, interfaceId),
      new PositionsSeenHiddenForSureProcess(puzzle, HintFace.EAST, row, interfaceId),
      new PositionsSeenHiddenForSureProcess(puzzle, HintFace.SOUTH, col, interfaceId),
      new PositionsSeenHiddenForSureProcess(puzzle, HintFace.WEST, row, interfaceId),
    ];
  }

  public constructor(
      private t: Towers,
      private face: HintFace,
      private rowIndex: number,
      interfaceId: number,
      private checkHiddenForSure: boolean = true,
      private checkSeenForSure: boolean = true) {
    super();
    const listName = isVertical(this.face) ? "Column" : "Row";
    if (!checkHiddenForSure) {
      this.friendlyName = `Positions Seen For Sure - ${faceToString(face)} Face - ${listName} ${rowIndex + 1}`;
    } else if (!checkSeenForSure) {
      this.friendlyName = `Positions Hidden For Sure - ${faceToString(face)} Face - ${listName} ${rowIndex + 1}`;
    } else {
      this.friendlyName = `Position Visibility - ${faceToString(face)} Face - ${listName} ${rowIndex + 1}`;
    }
    this.interfaceId = interfaceId;
    this.processId = `positions_${checkHiddenForSure}_${checkSeenForSure}_for_sure_check_${faceToString(face).toLowerCase()}_${rowIndex}_${interfaceId}`;
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
    if (this.depth < this.t.n) {
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
      if (min >= this.maxSeenSoFar) {
        this.actionMessage = `${ordinal(this.depth + 1)} cell seen for sure.`;
        this.indicesSeenForSure.push(this.depth);
      } else if (max <= this.largestMinSeenSoFar) {
        this.actionMessage = `${ordinal(this.depth + 1)} cell hidden for sure.`;
        this.indicesHiddenForSure.push(this.depth);
      } else {
        this.actionMessage = `${ordinal(this.depth + 1)} cell might be seen or hidden.`;
        this.indicesWithUnkownVisibility.push(this.depth);
      }
      this.maxSeenSoFar = Math.max(this.maxSeenSoFar, max);
      this.largestMinSeenSoFar = Math.max(this.largestMinSeenSoFar, min);
      this.depth += 1;
    } else {
      if (this.checkHiddenForSure && this.checkSeenForSure) {
        this.actionMessage = `${this.indicesSeenForSure.length} cells seen for sure and ${this.indicesHiddenForSure.length} cells hidden for sure.`;
      } else if (this.checkSeenForSure) {
        this.actionMessage = `${this.indicesSeenForSure.length} cells seen for sure.`;
      } else if (this.checkHiddenForSure) {
        this.actionMessage = `${this.indicesHiddenForSure.length} cells hidden for sure.`;
      }
      this.depth = -1;
      this.doneScanning = true;
    }
  }

  private evaluationTick() {
    if (this.checkSeenForSure && this.indicesSeenForSure.length > this.hint) {
      this.actionMessage = `Too many cells seen for sure: Contradiction!`;
      this.done = true;
      this.t.noticeContradiction({
        type: ContradictionType.VIEW,
        noticedOnMove: this.t.history.length,
        face: this.face,
        rowIndex: this.rowIndex,
        cellIndices: this.indicesSeenForSure.concat(),
      })
    } else if (this.checkHiddenForSure && this.t.n - this.indicesHiddenForSure.length < this.hint) {
      this.actionMessage = `Too many cells hidden for sure: Contradiction!`;
      this.done = true;
      this.t.noticeContradiction({
        type: ContradictionType.VIEW,
        noticedOnMove: this.t.history.length,
        face: this.face,
        rowIndex: this.rowIndex,
        cellIndices: this.indicesHiddenForSure.concat(),
      })
    } else if (this.checkSeenForSure && this.indicesSeenForSure.length == this.hint) {
      this.actionMessage = `All other cells must be hidden.`;
      this.depth = 0;
      this.maxSeenSoFar = -1;
      this.step = "find_next";
      this.shouldHideUnknown = true;
    } else if (this.checkHiddenForSure && this.t.n - this.indicesHiddenForSure.length == this.hint) {
      this.actionMessage = `All other cells must be seen.`;
      this.depth = 0;
      this.largestMinSeenSoFar = -1;
      this.step = "find_next";
      this.shouldHideUnknown = false;
    } else {
      this.actionMessage = `Not enough information. Done.`;
      this.done = true;
    }
  }

  private findNextTick() {
    const n = this.t.n;
    while (this.depth < n && this.indicesWithUnkownVisibility.indexOf(this.depth) == -1) {
      const [col, row] = this.currentCoordinates();
      const possibilities = Array.from(this.t.marks.getWithRowCol(row, col)).sort();
      this.maxSeenSoFar = Math.max(this.maxSeenSoFar, possibilities[possibilities.length - 1]);
      this.largestMinSeenSoFar = Math.max(this.largestMinSeenSoFar, possibilities[0]);
      this.depth += 1;
    }
    if (this.depth < n) {
      if (this.shouldHideUnknown) {
        this.actionMessage = `${ordinal(this.depth + 1)} cell can't be ${this.maxSeenSoFar + 1} or more.`;
      } else {
        this.actionMessage = `${ordinal(this.depth + 1)} cell can't be ${this.largestMinSeenSoFar + 1} or less.`;
      }
      this.step = 'remove';
    } else {
      this.actionMessage = "Done!";
      this.done = true;
    }
  }

  private removeTooTallTick() {
    let [col, row] = this.currentCoordinates();
    for (let i = this.maxSeenSoFar; i < this.t.n; ++i) {
      this.t.removeFromCell(row, col, i);
    }

    const possibilities = Array.from(this.t.marks.getWithRowCol(row, col)).sort();
    this.minOfCurrentCell = possibilities[0]
    this.maxOfCurrentCell = possibilities[possibilities.length - 1]
    this.maxSeenSoFar = Math.max(this.maxSeenSoFar, this.maxOfCurrentCell);
    this.largestMinSeenSoFar = Math.max(this.largestMinSeenSoFar, this.minOfCurrentCell);

    this.actionMessage = `At least one previous cell has to be ${this.minOfCurrentCell + 2} or more.`;
    this.checkDepth = 0;
    this.covers = [];
    this.step = 'check_in_front'
  }

  private removeTooShortTick() {
    const [col, row] = this.currentCoordinates();
    for (let i = 0; i <= this.largestMinSeenSoFar; ++i) {
      this.t.removeFromCell(row, col, i);
    }

    const possibilities = Array.from(this.t.marks.getWithRowCol(row, col)).sort();
    this.minOfCurrentCell = possibilities[0]
    this.maxOfCurrentCell = possibilities[possibilities.length - 1]
    this.maxSeenSoFar = Math.max(this.maxSeenSoFar, this.maxOfCurrentCell);
    this.largestMinSeenSoFar = Math.max(this.largestMinSeenSoFar, this.minOfCurrentCell);

    this.actionMessage = `No previous cell can be ${this.maxOfCurrentCell + 1} or taller.`;
    this.checkDepth = 0;
    this.step = 'check_in_front'
  }

  private checkInFrontOfHiddenTick() {
    if (this.checkDepth < this.depth) {
      let [col, row] = this.coordinates(this.checkDepth);
      const possibilities = Array.from(this.t.marks.getWithRowCol(row, col)).sort();
      if (possibilities[0] > this.minOfCurrentCell) {
        this.actionMessage = `${ordinal(this.checkDepth + 1)} cell is at least ${this.minOfCurrentCell + 2} and so can provide cover.`;
        this.step = 'find_next';
        this.depth += 1;
      } else if (possibilities[possibilities.length - 1] > this.minOfCurrentCell) {
        this.actionMessage = `${ordinal(this.checkDepth + 1)} cell can be taller than ${this.minOfCurrentCell + 1} and provide cover.`;
        this.covers.push(this.checkDepth);
        if (this.covers.length > 1) {
          this.checkDepth = this.depth;
        }
      } else {
        this.actionMessage = `${ordinal(this.checkDepth + 1)} cell can't be taller than ${this.minOfCurrentCell + 1} so it won't provide cover.`;
      }
      this.checkDepth += 1;
    } else {
      if (this.covers.length == 0) {
        this.actionMessage = `${ordinal(this.depth + 1)} cell can't be seen, but also can't be covered: Contradiction!`;
        this.done = true;
        this.t.noticeContradiction({
          type: ContradictionType.VIEW,
          noticedOnMove: this.t.history.length,
          face: this.face,
          rowIndex: this.rowIndex,
          cellIndices: this.indicesSeenForSure.concat([this.depth]),
        })
      } else if (this.covers.length == 1) {
        this.actionMessage = `Only ${ordinal(this.covers[0] + 1)} cell can provide cover. So it must be at least ${this.minOfCurrentCell + 2}`;
        this.step = 'remove_in_front';
      } else {
        this.actionMessage = `Multiple cells could provide cover. Not enough information.`;
        this.step = 'find_next';
        this.depth += 1;
      }
    }
  }

  private checkInFrontOfSeenTick() {
    this.actionMessage = `Making sure ${ordinal(this.checkDepth + 1)} cell is shorter than ${this.maxOfCurrentCell + 1}.`;
    const [col, row] = this.coordinates(this.checkDepth);
    const possibilities = Array.from(this.t.marks.getWithRowCol(row, col)).sort();
    if (possibilities[possibilities.length - 1] < this.maxOfCurrentCell) {
      this.checkDepth += 1
      if (this.checkDepth >= this.depth) {
        this.depth += 1;
        this.step = 'find_next'
      }
    } else {
      this.step = 'remove_in_front';
    }
  }

  private removeInFrontOfHiddenTick() {
    let [col, row] = this.coordinates(this.covers[0]);
    for (let i = 0; i <= this.minOfCurrentCell; ++i) {
      this.t.removeFromCell(row, col, i);
    }
    this.step = 'find_next';
    this.depth += 1;
    this.tick();
  }

  private removeInFrontOfSeenTick() {
    this.actionMessage = `Removed possibilities from ${ordinal(this.checkDepth + 1)} cell.`;
    const [col, row] = this.coordinates(this.checkDepth);
    for (let i = this.maxOfCurrentCell; i < this.t.n; ++i) {
      this.t.removeFromCell(row, col, i);
    }
    this.checkDepth += 1;
    if (this.checkDepth >= this.depth) {
      this.depth += 1;
      this.step = 'find_next';
    } else {
      this.step = 'check_in_front';
    }
  }

  public tick(): boolean {
    if (this.done) {
      return true;
    } else if (!this.checkedHint) {
      this.checkHintTick();
    } else if (this.hint == -1) {
      this.actionMessage = `No hint, nothing to do. Done!`;
      this.done = true;
    } else if (!this.doneScanning) {
      this.scanningTick();
    } else {
      if (this.depth == -1) {
        this.evaluationTick();
      } else {
        if (this.shouldHideUnknown) {
          if (this.step == 'find_next') {
            this.findNextTick();
          } else if (this.step == 'remove') {
            this.removeTooTallTick();
          } else if (this.step == 'check_in_front') {
            this.checkInFrontOfHiddenTick();
          } else if (this.step == 'remove_in_front') {
            this.removeInFrontOfHiddenTick();
          }
        } else {
          if (this.step == 'find_next') {
            this.findNextTick();
          } else if (this.step == 'remove') {
            this.removeTooShortTick();
          } else if (this.step == 'check_in_front') {
            this.checkInFrontOfSeenTick();
          } else if (this.step == 'remove_in_front') {
            this.removeInFrontOfSeenTick();
          }
        }
      }
    }
    return false;
  }
}

export class PositionsSeenForSureProcess extends PositionsSeenHiddenForSureProcess {
  public constructor(t: Towers, face: HintFace, rowIndex: number, interfaceId: number) {
    super(t, face, rowIndex, interfaceId, false, true);
  }

  public static processesForCell(puzzle: Towers, row: number, col: number, interfaceId: number): PositionsSeenForSureProcess[] {
    return [
      new PositionsSeenForSureProcess(puzzle, HintFace.NORTH, col, interfaceId),
      new PositionsSeenForSureProcess(puzzle, HintFace.EAST, row, interfaceId),
      new PositionsSeenForSureProcess(puzzle, HintFace.SOUTH, col, interfaceId),
      new PositionsSeenForSureProcess(puzzle, HintFace.WEST, row, interfaceId),
    ];
  }
}

export class PositionsHiddenForSureProcess extends PositionsSeenHiddenForSureProcess {
  public constructor(t: Towers, face: HintFace, rowIndex: number, interfaceId: number) {
    super(t, face, rowIndex, interfaceId, true, false);
  }

  public static processesForCell(puzzle: Towers, row: number, col: number, interfaceId: number): PositionsHiddenForSureProcess[] {
    return [
      new PositionsHiddenForSureProcess(puzzle, HintFace.NORTH, col, interfaceId),
      new PositionsHiddenForSureProcess(puzzle, HintFace.EAST, row, interfaceId),
      new PositionsHiddenForSureProcess(puzzle, HintFace.SOUTH, col, interfaceId),
      new PositionsHiddenForSureProcess(puzzle, HintFace.WEST, row, interfaceId),
    ];
  }
}
