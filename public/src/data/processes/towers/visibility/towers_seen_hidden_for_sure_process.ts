import Process from '../../../process.js'
import Towers, {HintFace, faceToString, isClockwise, isVertical, getCoordinates, ContradictionType} from '../../../../puzzles/towers/towers.js'

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

export class TowersSeenHiddenForSureProcess extends Process<void> {
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
  private towersSeenForSure: Set<number> = new Set();
  private towersHiddenForSure: Set<number> = new Set();
  private towersWithUnkownVisibility: Set<number> = new Set();
  private hasEncounteredTower: boolean = false;
  private shouldHideUnknown: boolean = false;
  private step: 'find_next'|'check' = 'find_next';
  private checkDepth = -1;
  private lastPositions: number[] = [];
  private covers: number[] = [];
  public readonly returnValue: void = undefined;
  private done: boolean = false;
  private actionMessage: string = 'Waiting for process to run...'

  public static processesForCell(puzzle: Towers, row: number, col: number, interfaceId: number): TowersSeenHiddenForSureProcess[] {
    return [
      new TowersSeenHiddenForSureProcess(puzzle, HintFace.NORTH, col, interfaceId),
      new TowersSeenHiddenForSureProcess(puzzle, HintFace.EAST, row, interfaceId),
      new TowersSeenHiddenForSureProcess(puzzle, HintFace.SOUTH, col, interfaceId),
      new TowersSeenHiddenForSureProcess(puzzle, HintFace.WEST, row, interfaceId),
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
      this.friendlyName = `Towers Seen For Sure - ${faceToString(face)} Face - ${listName} ${rowIndex + 1}`;
    } else if (!checkSeenForSure) {
      this.friendlyName = `Towers Hidden For Sure - ${faceToString(face)} Face - ${listName} ${rowIndex + 1}`;
    } else {
      this.friendlyName = `Tower Visibility - ${faceToString(face)} Face - ${listName} ${rowIndex + 1}`;
    }
    this.interfaceId = interfaceId;
    this.processId = `towers_${checkHiddenForSure}_${checkSeenForSure}_for_sure_check_${faceToString(face).toLowerCase()}_${rowIndex}_${interfaceId}`;
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
    for (let i = 0; i < this.t.n; ++i) {
      this.towersSeenForSure.add(i);
      this.towersHiddenForSure.add(i)
      this.towersWithUnkownVisibility = new Set();
      this.lastPositions.push(-1);
    }
  }

  private scanningTick() {
    if (this.depth < this.t.n) {
      const [col, row] = this.currentCoordinates();
      const possibilities = this.t.marks.getWithRowCol(row, col);
      if (possibilities.size == 0) {
        this.t.noticeContradiction({
          type: ContradictionType.NO_POSSIBILITES,
          noticedOnMove: this.t.history.length,
          row: row,
          col: col,
        })
        return;
      }
      const sorted = Array.from(possibilities).sort();
      const min = sorted[0];
      const max = sorted[sorted.length - 1];

      const newlyPotentiallyHidden = [];
      const newlyPotentiallySeen = [];

      for (let p of possibilities) {
        if (p < this.maxSeenSoFar) {
          if (this.towersSeenForSure.delete(p)) {
            newlyPotentiallyHidden.push(p);
          }
        }
        if (p > this.largestMinSeenSoFar) {
          if (this.towersHiddenForSure.delete(p)) {
            newlyPotentiallySeen.push(p);
          }
        }
        this.lastPositions[p] = this.depth;
      }
      this.actionMessage = '';
      if (this.checkHiddenForSure && newlyPotentiallySeen.length > 0) {
        this.actionMessage += `Towers of height ${Array.from(newlyPotentiallySeen).map(x => x+1).sort()} could be seen in the ${ordinal(this.depth + 1)} cell.`;
      }
      if (this.checkSeenForSure && newlyPotentiallyHidden.length > 0) {
        this.actionMessage += `Towers of height ${Array.from(newlyPotentiallyHidden).map(x => x+1).sort()} could be hidden in the ${ordinal(this.depth + 1)} cell.`;
      }
      if (this.actionMessage == '') {
        this.actionMessage = `No new information from ${ordinal(this.depth + 1)} cell.`
      }
      this.maxSeenSoFar = Math.max(this.maxSeenSoFar, max);
      this.largestMinSeenSoFar = Math.max(this.largestMinSeenSoFar, min);
      this.depth += 1;
    } else {
      for (let i = 0; i < this.t.n; ++i) {
        if (!this.towersSeenForSure.has(i) && !this.towersHiddenForSure.has(i)) {
          this.towersWithUnkownVisibility.add(i);
        }
      }

      if (this.checkHiddenForSure && this.checkSeenForSure) {
        this.actionMessage = `${this.towersSeenForSure.size} towers seen for sure and ${this.towersHiddenForSure.size} towers hidden for sure.`;
      } else if (this.checkSeenForSure) {
        this.actionMessage = `${this.towersSeenForSure.size} towers seen for sure.`;
      } else if (this.checkHiddenForSure) {
        this.actionMessage = `${this.towersHiddenForSure.size} towers hidden for sure.`;
      }
      this.depth = -1;
      this.doneScanning = true;
    }
  }

  private evaluationTick() {
    if (this.checkSeenForSure && this.towersSeenForSure.size > this.hint) {
      this.actionMessage = `Too many towers seen for sure: Contradiction!`;
      this.done = true;
      this.t.noticeContradiction({
        type: ContradictionType.VIEW,
        noticedOnMove: this.t.history.length,
        face: this.face,
        rowIndex: this.rowIndex,
        cellIndices: [],
      })
    } else if (this.checkHiddenForSure && this.t.n - this.towersHiddenForSure.size < this.hint) {
      this.actionMessage = `Too many towers hidden for sure: Contradiction!`;
      this.done = true;
      this.t.noticeContradiction({
        type: ContradictionType.VIEW,
        noticedOnMove: this.t.history.length,
        face: this.face,
        rowIndex: this.rowIndex,
        cellIndices: [],
      })
    } else if (this.checkSeenForSure && this.towersSeenForSure.size == this.hint) {
      this.actionMessage = `All other towers must be hidden.`;
      this.depth = 0;
      this.maxSeenSoFar = -1;
      this.step = "find_next";
      this.shouldHideUnknown = true;
    } else if (this.checkHiddenForSure && this.t.n - this.towersHiddenForSure.size == this.hint) {
      this.actionMessage = `All other towers must be seen.`;
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
    if (this.towersWithUnkownVisibility.size == 0) {
      this.actionMessage = "Done!";
      this.done = true;
      return;
    }
    this.depth = Array.from(this.towersWithUnkownVisibility).sort()[0];
    if (this.shouldHideUnknown) {
      this.actionMessage = `Tower of height ${this.depth + 1} must be hidden.`;
    } else {
      this.actionMessage = `Tower of height ${this.depth + 1} must be seen.`;
    }
    this.checkDepth = 0;
    this.maxSeenSoFar = -1;
    this.largestMinSeenSoFar = -1;
    this.step = 'check';
    this.hasEncounteredTower = false;
    this.covers = [];
  }

  private checkIfMustBeHidden() {
    if (this.checkDepth == this.t.n) {
      if (this.covers.length == 0) {
        this.actionMessage = `Tower of height ${this.depth + 1} has to be hidden but can't be covered: Contradiction!.`;
        this.done = true;
        this.t.noticeContradiction({
          type: ContradictionType.VIEW,
          noticedOnMove: this.t.history.length,
          face: this.face,
          rowIndex: this.rowIndex,
          cellIndices: [],
        })
      } else if (this.covers.length == 1) {
        this.actionMessage = `Only ${ordinal(this.covers[0] + 1)} cell can cover tower of height ${this.depth + 1}.`;
        for (let i = 0; i <= this.depth; ++i) {
          const [col, row] = this.coordinates(this.covers[0]);
          this.t.removeFromCell(row, col, i);
        }
      } else {
        this.actionMessage = `Multiple choices to cover tower of height ${this.depth + 1}.`;
      }
      this.actionMessage = `Done with tower of height ${this.depth + 1}.`;
      this.checkDepth += 1;
      return;
    }

    if (this.checkDepth > this.t.n) {
      this.step = 'find_next';
      this.towersWithUnkownVisibility.delete(this.depth);
      this.actionMessage = `Done with tower of height ${this.depth + 1}.`;
      return;
    }

    const [col, row] = this.coordinates(this.checkDepth);
    let possibilities = this.t.marks.getWithRowCol(row, col);
    if (possibilities.size == 0) {
      this.t.noticeContradiction({
        type: ContradictionType.NO_POSSIBILITES,
        noticedOnMove: this.t.history.length,
        row: row,
        col: col,
      })
      return;
    }
    let sorted = Array.from(possibilities).sort();
    let min = sorted[0];
    let max = sorted[sorted.length - 1];

    if (this.maxSeenSoFar <= this.depth) {
      if (possibilities.has(this.depth)) {
        this.actionMessage = `${ordinal(this.checkDepth + 1)} cell can't be tower of height ${this.depth + 1} since that tower must be hidden.`;
        this.t.removeFromCell(row, col, this.depth);
      } else {
        this.actionMessage = `${ordinal(this.checkDepth + 1)} cell can't be tower of height ${this.depth + 1} to begin with.`;
      }
    }

    if (this.checkDepth < this.lastPositions[this.depth] && max > this.depth) {
      this.covers.push(this.checkDepth);
    }

    possibilities = this.t.marks.getWithRowCol(row, col);
    sorted = Array.from(possibilities).sort();
    min = sorted[0];
    max = sorted[sorted.length - 1];
    this.maxSeenSoFar = Math.max(this.maxSeenSoFar, max);
    this.largestMinSeenSoFar = Math.max(this.largestMinSeenSoFar, min);

    this.checkDepth += 1;
  }

  private checkIfMustBeSeen() {
    if (this.checkDepth >= this.t.n) {
      this.step = 'find_next';
      this.towersWithUnkownVisibility.delete(this.depth);
      this.actionMessage = `Done with tower of height ${this.depth + 1}.`;
      return;
    }

    const [col, row] = this.coordinates(this.checkDepth);
    let possibilities = this.t.marks.getWithRowCol(row, col);
    if (possibilities.size == 0) {
      this.t.noticeContradiction({
        type: ContradictionType.NO_POSSIBILITES,
        noticedOnMove: this.t.history.length,
        row: row,
        col: col,
      })
      return;
    }
    let sorted = Array.from(possibilities).sort();
    let max = sorted[sorted.length - 1];
    if (!this.hasEncounteredTower) {
      if (max > this.depth) {
        this.actionMessage = `${ordinal(this.checkDepth + 1)} cell can't be taller than ${this.depth + 1}.`;
        for (let i = this.depth + 1; i < this.t.n; ++i) {
          this.t.removeFromCell(row, col, i);
        }
      } else {
        this.actionMessage = `${ordinal(this.checkDepth + 1)} cell can't hide tower of height ${this.depth + 1} to begin with.`;
      }
    } else if (this.largestMinSeenSoFar > this.depth) {
      this.actionMessage = `Tower of heigth ${this.depth + 1} cell can't be behind tower of height ${this.largestMinSeenSoFar + 1}.`;
      this.t.removeFromCell(row, col, this.depth);
    } else {
      for (let i = this.depth + 1; i < this.t.n; ++i) {
        if (this.lastPositions[i] <= this.checkDepth) {
          this.actionMessage = `Tower of heigth ${this.depth + 1} can't be behind tower of height ${i + 1}, so it can't be in ${ordinal(this.checkDepth + 1)} cell.`;
          this.t.removeFromCell(row, col, this.depth);
          break;
        }
      }
    }

    possibilities = this.t.marks.getWithRowCol(row, col);
    sorted = Array.from(possibilities).sort();
    max = sorted[sorted.length - 1];
    const min = sorted[0];

    this.maxSeenSoFar = Math.max(this.maxSeenSoFar, max);
    this.largestMinSeenSoFar = Math.max(this.largestMinSeenSoFar, min);
    if (possibilities.has(this.depth)) {
      this.hasEncounteredTower = true;
    }
    this.checkDepth += 1;
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
          } else if (this.step == 'check') {
            this.checkIfMustBeHidden();
          }
        } else {
          if (this.step == 'find_next') {
            this.findNextTick();
          } else if (this.step == 'check') {
            this.checkIfMustBeSeen();
          }
        }
      }
    }
    return false;
  }
}

export class TowersSeenForSureProcess extends TowersSeenHiddenForSureProcess {
  public constructor(t: Towers, face: HintFace, rowIndex: number, interfaceId: number) {
    super(t, face, rowIndex, interfaceId, false, true);
  }

  public static processesForCell(puzzle: Towers, row: number, col: number, interfaceId: number): TowersSeenForSureProcess[] {
    return [
      new TowersSeenForSureProcess(puzzle, HintFace.NORTH, col, interfaceId),
      new TowersSeenForSureProcess(puzzle, HintFace.EAST, row, interfaceId),
      new TowersSeenForSureProcess(puzzle, HintFace.SOUTH, col, interfaceId),
      new TowersSeenForSureProcess(puzzle, HintFace.WEST, row, interfaceId),
    ];
  }
}

export class TowersHiddenForSureProcess extends TowersSeenHiddenForSureProcess {
  public constructor(t: Towers, face: HintFace, rowIndex: number, interfaceId: number) {
    super(t, face, rowIndex, interfaceId, true, false);
  }

  public static processesForCell(puzzle: Towers, row: number, col: number, interfaceId: number): TowersHiddenForSureProcess[] {
    return [
      new TowersHiddenForSureProcess(puzzle, HintFace.NORTH, col, interfaceId),
      new TowersHiddenForSureProcess(puzzle, HintFace.EAST, row, interfaceId),
      new TowersHiddenForSureProcess(puzzle, HintFace.SOUTH, col, interfaceId),
      new TowersHiddenForSureProcess(puzzle, HintFace.WEST, row, interfaceId),
    ];
  }
}
