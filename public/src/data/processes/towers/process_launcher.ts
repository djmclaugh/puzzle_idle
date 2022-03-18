import Towers, {Action, ActionType, VisibilityAction} from  '../../../puzzles/towers/towers.js'
import {HintFace, ALL_FACES, isVertical, getCoordinates} from  '../../../puzzles/towers/hint_face.js'
import {Triple} from  '../../../puzzles/towers/triple_collection.js'

import TowersOptions from '../../towers/towers_options.js'
import TowersUpgrades from '../../towers/towers_upgrades.js'

import Process from '../../process.js'

import BetterSimpleViewProcess from './visibility/better_simple_view_process.js'
import SimpleViewProcess from './visibility/simple_view_process.js'
import MaxViewProcess from './visibility/max_view_process.js'
import OneViewProcess from './visibility/one_view_process.js'
import NotOneViewProcess from './visibility/not_one_view_process.js'
import CheckPossibilityVisibilityProcess from './visibility/check_possibility_visibility_process.js'
import CheckCellSeenHiddenCountProcess from './visibility/check_cell_seen_hidden_count_process.js'
import CheckTowerSeenHiddenCountProcess from './visibility/check_tower_seen_hidden_count_process.js'
import RemovePossibilityWithContradictoryVisibilityProcess from './visibility/remove_possibility_with_contradictory_visibility_process.js'
import CellMustBeSeenProcess from './visibility/cell_must_be_seen_process.js'
import CellMustBeHiddenProcess from './visibility/cell_must_be_hidden_process.js'
import TowerMustBeSeenProcess from './visibility/tower_must_be_seen_process.js'
import TowerMustBeHiddenProcess from './visibility/tower_must_be_hidden_process.js'

import RemoveFromColumnProcess from './latin/remove_from_column_process.js'
import RemoveFromRowProcess from './latin/remove_from_row_process.js'
import OnlyChoiceInRowProcess from './latin/only_choice_in_row_process.js'
import OnlyChoiceInColumnProcess from './latin/only_choice_in_column_process.js'

export type Listener = (p: Process<any>, priority: number) => void;

export default class ProcessLauncher {
  private listeners: Set<Listener> = new Set();

  constructor(private options: TowersOptions, private upgrades: TowersUpgrades, private id: number) {}

  public addListener(l: Listener) {
    this.listeners.add(l)
  }

  public removeListener(l: Listener) {
    this.listeners.delete(l)
  }

  private startProcess(p: Process<any>, priority: number) {
    for (const l of this.listeners) {
      l(p, priority);
    }
  }

  private onPossibilitySet(towers: Towers, t: Triple) {
    if (this.options.removeOnSetOn) {
      const pCol = new RemoveFromColumnProcess(towers, t.val, t.col, t.row, this.id);
      this.startProcess(pCol, 9);
      const pRow = new RemoveFromRowProcess(towers, t.val, t.row, t.col, this.id);
      this.startProcess(pRow, 9);
    }
  }

  private onPossibilityRemoved(towers: Towers, t: Triple) {
    if (this.options.onlyInRowColumnOn) {
      const colP = new OnlyChoiceInColumnProcess(towers, t.col, t.val, this.id);
      this.startProcess(colP, 8);
      const rowP = new OnlyChoiceInRowProcess(towers, t.row, t.val, this.id);
      this.startProcess(rowP, 8);
    }

    for (const face of ALL_FACES) {
      if (isVertical(face)) {
        this.recheckVisibility(towers, t.col, face);
      } else {
        this.recheckVisibility(towers, t.row, face);
      }
    }
  }

  private recheckVisibility(t: Towers, rowIndex: number, face: HintFace) {
    if (this.options.positionVisibilityOn || this.options.towerVisibilityOn) {
      this.startProcess(new CheckPossibilityVisibilityProcess(t, face, rowIndex, this.id), 7);
    }
    if (this.options.positionVisibilityOn) {
      this.startProcess(new CheckCellSeenHiddenCountProcess(t, face, rowIndex, this.id), 5);
      // for (let i = 0; i < t.n; ++i) {
      //   let [col, row] = getCoordinates(face, rowIndex, i, t.n);
      //   this.startProcess(new CellMustBeSeenProcess(t, row, col, face, this.id), 5);
      //   this.startProcess(new CellMustBeHiddenProcess(t, row, col, face, this.id), 5);
      // }
    }
    if (this.options.towerVisibilityOn) {
      this.startProcess(new CheckTowerSeenHiddenCountProcess(t, face, rowIndex, this.id), 5);
      // for (let i = 0; i < t.n; ++i) {
      //   let [col, row] = getCoordinates(face, rowIndex, i, t.n);
      //   this.startProcess(new TowerMustBeSeenProcess(t, row, col, face, this.id), 5);
      //   this.startProcess(new TowerMustBeHiddenProcess(t, row, col, face, this.id), 5);
      // }
    }
  }

  private onVisibilityChanged(towers: Towers, a: VisibilityAction) {
    const p = new RemovePossibilityWithContradictoryVisibilityProcess(towers, {row: a.row, col: a.col, val: a.val}, a.face, this.id);
    this.startProcess(p, 9);
    if (isVertical(a.face)) {
      this.recheckVisibility(towers, a.col, a.face);
    } else {
      this.recheckVisibility(towers, a.row, a.face);
    }
  }

  public onAction(t: Towers, a: Action) {
    if (a.type == ActionType.SET_POSSIBILITY) {
      this.onPossibilitySet(t, {row: a.row, col: a.column, val: a.value});
      for (let val of a.previousPossibilities) {
        if (val != a.value) {
          this.onPossibilityRemoved(t, {row: a.row, col: a.column, val});
        }
      }
    }
    if (a.type == ActionType.REMOVE_POSSIBILITY) {
      this.onPossibilityRemoved(t, {row: a.row, col: a.column, val: a.value});
      const cell = t.marksCell(a.row, a.column);
      if (cell.size == 1) {
        const val: number = cell.values().next().value;
        this.onPossibilitySet(t, {row: a.row, col: a.column, val});
      }
    }
    if (a.type == ActionType.SET_VISIBILITY) {
      this.onVisibilityChanged(t, a);
    }
  }

  public startInitialProcessesIfNeeded(t: Towers) {
    if (t.history.length != 0) {
      return;
    }
    if (this.upgrades.simpleViewProcess.isUnlocked) {
      if (this.options.simpleViewOn) {
        for (const face of ALL_FACES) {
          const p = this.upgrades.betterSimpleViewProcess.isUnlocked ?
              new BetterSimpleViewProcess(t, face, this.id) :
              new SimpleViewProcess(t, face, this.id);
          this.startProcess(p, 9);
        }
      }
    } else {
      for (const face of ALL_FACES) {
        if (this.options.maxViewOn) {
          const p = new MaxViewProcess(t, face, this.id);
          this.startProcess(p, 9);
        }
        if (this.options.oneViewOn) {
          const p = new OneViewProcess(t, face, this.id);
          this.startProcess(p, 9);
        }
        if (this.options.notOneViewOn) {
          const p = new NotOneViewProcess(t, face, this.id);
          this.startProcess(p, 9);
        }
      }
    }
    if (this.options.removeOnSetOn) {
      for (let row = 0; row < t.n; ++row) {
        for (let col = 0; col < t.n; ++col) {
          const possibilities = t.marksCell(row, col);
          if (possibilities.size == 1) {
            const val: number = possibilities.values().next().value;
            const pCol = new RemoveFromColumnProcess(t, val, col, row, this.id);
            this.startProcess(pCol, 9);
            const pRow = new RemoveFromRowProcess(t, val, row, col, this.id);
            this.startProcess(pRow, 9);
          }
        }
      }
    }
  }
}
