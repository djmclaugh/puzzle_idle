import Vue from '../../../vue.js'

import Towers, { Action, ActionType, VisibilityAction } from  '../../../puzzles/towers/towers.js'
import { HintFace, ALL_FACES, isVertical } from  '../../../puzzles/towers/hint_face.js'
import { Triple } from  '../../../puzzles/towers/triple_collection.js'

import TowersOptions from '../../towers/towers_options.js'
import { towersUpgrades as upgrades } from '../../towers/towers_upgrades.js'
import { currentCPU } from '../../cpu.js'

import Process from '../../process.js'

import RandomGuessProcess from './random_guess_process.js'

import SimpleViewProcess, { SimpleViewProcessOptions } from './visibility/simple_view_process.js'
import CheckPossibilityVisibilityProcess from './visibility/check_possibility_visibility_process.js'
import CheckCellSeenHiddenCountProcess from './visibility/check_cell_seen_hidden_count_process.js'
import CheckTowerSeenHiddenCountProcess from './visibility/check_tower_seen_hidden_count_process.js'
import RemovePossibilityWithContradictoryVisibilityProcess from './visibility/remove_possibility_with_contradictory_visibility_process.js'
import CellMustBeSeenProcess from './visibility/cell_must_be_seen_process.js'
import CellMustBeHiddenProcess from './visibility/cell_must_be_hidden_process.js'
import TowerMustBeSeenProcess from './visibility/tower_must_be_seen_process.js'
import TowerMustBeHiddenProcess from './visibility/tower_must_be_hidden_process.js'

import LastCellLeftProcess from './latin/last_cell_left_process.js'
import RemoveFromColumnProcess from './latin/remove_from_column_process.js'
import RemoveFromRowProcess from './latin/remove_from_row_process.js'
import OnlyChoiceInRowProcess from './latin/only_choice_in_row_process.js'
import OnlyChoiceInColumnProcess from './latin/only_choice_in_column_process.js'

export type Listener = (p: Process<any>, priority: number) => void;

export default class ProcessLauncher {
  public activeProcesses: Set<Process<any>> = new Set();
  public randomGuess: RandomGuessProcess|null = null;
  public hasRandomGuess = Vue.ref(false);
  public processCount = Vue.ref(0);

  constructor(private towers: Towers, private options: TowersOptions, private id: number) {
    towers.onAction((a: Action) => { this.onAction(a); });
    this.startInitialProcessesIfNeeded();
    this.startRandomGuessProcessIfNeeded();
  }

  public stopAllProcesses() {
    for (const p of this.activeProcesses) {
      currentCPU.killProcess(p);
    }
    this.activeProcesses.clear();
    if (this.randomGuess) {
      currentCPU.killProcess(this.randomGuess);
      this.randomGuess = null;
      this.hasRandomGuess.value = false;
    }
    this.processCount.value = this.activeProcesses.size;
  }

  private onProcessOver<R>(process: Process<R>) {
    return () => {
      this.activeProcesses.delete(process);
      this.startRandomGuessProcessIfNeeded();
      this.processCount.value = this.activeProcesses.size;
    }
  }

  private startProcess(p: Process<any>, priority: number) {
    if (this.towers.hasContradiction) {
      // If a contradiction has been found, wait until it has been resolved
      // before making any inferences.
      return;
    }
    if (currentCPU.addProcess(p, priority, this.onProcessOver(p))) {
      this.activeProcesses.add(p);
      this.processCount.value = this.activeProcesses.size;
    }
  }

  public startRandomGuessProcessIfNeeded() {
    if (this.options.randomGuessOn && this.activeProcesses.size == 0 && !this.towers.isReadyForValidation()) {
      if (this.towers.hasContradiction) {
        // If a contradiction has been found, wait until it has been resolved
        // before making any inferences.
        return;
      }
      const p = new RandomGuessProcess(this.towers, this.id);
      if (currentCPU.addProcess(p, 1, () => {
        this.randomGuess = null;
        this.hasRandomGuess.value = false;
        this.activeProcesses.delete(p);
        Vue.nextTick(() => { this.startRandomGuessProcessIfNeeded(); });
      })) {
        this.randomGuess = p;
        this.hasRandomGuess.value = true;
        this.activeProcesses.add(p);
        this.processCount.value = this.activeProcesses.size;
      }
    }
  }

  private onPossibilitySet(t: Triple) {
    if (this.options.removeOnSetOn) {
      if (upgrades.removeFromColumnRowProcess.isUnlocked) {
        const pCol = new RemoveFromColumnProcess(this.towers, t.val, t.col, t.row, this.id);
        this.startProcess(pCol, 8);
        const pRow = new RemoveFromRowProcess(this.towers, t.val, t.row, t.col, this.id);
        this.startProcess(pRow, 8);
      } else {
        const pCol = new LastCellLeftProcess(this.towers, t.col, false, this.id);
        this.startProcess(pCol, 8);
        const pRow = new LastCellLeftProcess(this.towers, t.row, true, this.id);
        this.startProcess(pRow, 8);
      }
    }
  }

  private onPossibilityRemoved(t: Triple) {
    if (this.options.onlyInRowColumnOn) {
      const colP = new OnlyChoiceInColumnProcess(this.towers, t.col, t.val, this.id);
      this.startProcess(colP, 7);
      const rowP = new OnlyChoiceInRowProcess(this.towers, t.row, t.val, this.id);
      this.startProcess(rowP, 7);
    }

    for (const face of ALL_FACES) {
      const rowIndex = isVertical(face) ? t.col : t.row;
      if (this.options.cellMustBeSeenOn) {
        this.startProcess(new CellMustBeSeenProcess(this.towers, t.row, t.col, face, this.id), 5);
      }
      if (this.options.heightMustBeSeenOn) {
        this.startProcess(new TowerMustBeSeenProcess(this.towers, t.val, rowIndex, face, this.id), 5);
      }
      if (this.options.cellMustBeHiddenOn) {
        this.startProcess(new CellMustBeHiddenProcess(this.towers, t.row, t.col, face, this.id), 5);
        switch (face) {
          case HintFace.NORTH:
            for (let i = t.row + 1; i < this.towers.n; ++ i) {
              this.startProcess(new CellMustBeHiddenProcess(this.towers, i, t.col, face, this.id), 5);
            }
            break;
          case HintFace.SOUTH:
            for (let i = 0; i < t.row; ++ i) {
              this.startProcess(new CellMustBeHiddenProcess(this.towers, i, t.col, face, this.id), 5);
            }
            break;
          case HintFace.WEST:
            for (let i = t.col + 1; i < this.towers.n; ++ i) {
              this.startProcess(new CellMustBeHiddenProcess(this.towers, t.row, i, face, this.id), 5);
            }
            break;
          case HintFace.EAST:
            for (let i = 0; i < t.col; ++ i) {
              this.startProcess(new CellMustBeHiddenProcess(this.towers, t.row, i, face, this.id), 5);
            }
            break;
        }
      }
      if (this.options.heightMustBeHiddenOn) {
        this.startProcess(new TowerMustBeHiddenProcess(this.towers, t.val, rowIndex, face, this.id), 5);
        for (let i = 0; i < t.val; ++i) {
          this.startProcess(new TowerMustBeHiddenProcess(this.towers, i, rowIndex, face, this.id), 5);
        }
      }

      if (isVertical(face)) {
        if (this.options.detectVisibilityOn) {
          this.startProcess(new CheckPossibilityVisibilityProcess(this.towers, face, t.col, this.id), 7);
        }
        this.recheckVisibility(t.col, face);
      } else {
        if (this.options.detectVisibilityOn) {
          this.startProcess(new CheckPossibilityVisibilityProcess(this.towers, face, t.row, this.id), 7);
        }
        this.recheckVisibility(t.row, face);
      }
    }
  }

  private recheckVisibility(rowIndex: number, face: HintFace) {
    if (this.options.cellVisibilityCountOn) {
      this.startProcess(new CheckCellSeenHiddenCountProcess(this.towers, face, rowIndex, this.id), 5);
    }
    if (this.options.heightVisibilityCountOn) {
      this.startProcess(new CheckTowerSeenHiddenCountProcess(this.towers, face, rowIndex, true, this.id), 5);
    }
  }

  private onVisibilityChanged(a: VisibilityAction) {
    if (this.options.removeContradictoryVisibilityOn) {
      const p = new RemovePossibilityWithContradictoryVisibilityProcess(this.towers, {row: a.row, col: a.col, val: a.val}, a.face, this.id);
      this.startProcess(p, 9);
    }
    if (isVertical(a.face)) {
      this.recheckVisibility(a.col, a.face);
    } else {
      this.recheckVisibility(a.row, a.face);
    }
    if (this.options.cellMustBeSeenOn) {
      this.startProcess(new CellMustBeSeenProcess(this.towers, a.row, a.col, a.face, this.id), 5);
    }
    if (this.options.cellMustBeHiddenOn) {
      this.startProcess(new CellMustBeHiddenProcess(this.towers, a.row, a.col, a.face, this.id), 5);
    }
    const rowIndex = isVertical(a.face) ? a.col : a.row;
    if (this.options.heightMustBeSeenOn) {
      this.startProcess(new TowerMustBeSeenProcess(this.towers, a.val, rowIndex, a.face, this.id), 5);
    }
    if (this.options.heightMustBeHiddenOn) {
      this.startProcess(new TowerMustBeHiddenProcess(this.towers, a.val, rowIndex, a.face, this.id), 5);
    }
  }

  public onAction(a: Action) {
    if (this.randomGuess) {
      currentCPU.killProcess(this.randomGuess);
      this.activeProcesses.delete(this.randomGuess);
      this.randomGuess = null;
      this.hasRandomGuess.value = false;
    }
    if (this.towers.hasContradiction) {
      return;
    }
    if (a.type == ActionType.SET_POSSIBILITY) {
      this.onPossibilitySet({row: a.row, col: a.column, val: a.value});
      for (let val of a.previousPossibilities) {
        if (val != a.value) {
          this.onPossibilityRemoved({row: a.row, col: a.column, val});
        }
      }
    }
    if (a.type == ActionType.REMOVE_POSSIBILITY) {
      this.onPossibilityRemoved({row: a.row, col: a.column, val: a.value});
      const cell = this.towers.marksCell(a.row, a.column);
      if (cell.size == 1) {
        const val: number = cell.values().next().value;
        this.onPossibilitySet({row: a.row, col: a.column, val});
      }
    }
    if (a.type == ActionType.SET_VISIBILITY) {
      this.onVisibilityChanged(a);
    }
    this.startRandomGuessProcessIfNeeded();
  }

  public startInitialProcessesIfNeeded() {
    if (this.towers.history.length != 0) {
      return;
    }
    if (this.options.simpleViewOn) {
      const options: SimpleViewProcessOptions = {};
      options.with1View = upgrades.oneView.isUnlocked;
      options.with2View = upgrades.twoView.isUnlocked;
      options.with2Visibility = upgrades.twoVisibility.isUnlocked;
      options.withMaxView = upgrades.maxView.isUnlocked;
      options.withDepth = upgrades.betterSimpleView.isUnlocked;
      options.withVisibility = upgrades.tooShortTooFarUpgrade.isUnlocked;
      options.withMarkCompletedHints = upgrades.markHintSatisfied.isUnlocked;

      for (const face of ALL_FACES) {
        const p = new SimpleViewProcess(this.towers, face, options, this.id);
        this.startProcess(p, 9);
      }
    }
    if (this.options.removeOnSetOn) {
      for (let row = 0; row < this.towers.n; ++row) {
        for (let col = 0; col < this.towers.n; ++col) {
          const possibilities = this.towers.marksCell(row, col);
          if (possibilities.size == 1) {
            const val: number = possibilities.values().next().value;
            const pCol = new RemoveFromColumnProcess(this.towers, val, col, row, this.id);
            this.startProcess(pCol, 9);
            const pRow = new RemoveFromRowProcess(this.towers, val, row, col, this.id);
            this.startProcess(pRow, 9);
          }
        }
      }
    }
    this.startRandomGuessProcessIfNeeded();
  }
}
