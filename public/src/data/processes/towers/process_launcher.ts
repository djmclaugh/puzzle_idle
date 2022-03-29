import Towers, {Action, ActionType, VisibilityAction} from  '../../../puzzles/towers/towers.js'
import {HintFace, ALL_FACES, isVertical, getCoordinates} from  '../../../puzzles/towers/hint_face.js'
import {Triple} from  '../../../puzzles/towers/triple_collection.js'

import TowersOptions from '../../towers/towers_options.js'
import TowersUpgrades from '../../towers/towers_upgrades.js'

import Process from '../../process.js'

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
      this.startProcess(pCol, 8);
      const pRow = new RemoveFromRowProcess(towers, t.val, t.row, t.col, this.id);
      this.startProcess(pRow, 8);
    }
  }

  private onPossibilityRemoved(towers: Towers, t: Triple) {
    if (this.options.onlyInRowColumnOn) {
      const colP = new OnlyChoiceInColumnProcess(towers, t.col, t.val, this.id);
      this.startProcess(colP, 7);
      const rowP = new OnlyChoiceInRowProcess(towers, t.row, t.val, this.id);
      this.startProcess(rowP, 7);
    }

    for (const face of ALL_FACES) {
      const rowIndex = isVertical(face) ? t.col : t.row;
      if (this.options.cellMustBeSeenOn) {
        this.startProcess(new CellMustBeSeenProcess(towers, t.row, t.col, face, this.id), 5);
      }
      if (this.options.heightMustBeSeenOn) {
        this.startProcess(new TowerMustBeSeenProcess(towers, t.val, rowIndex, face, this.id), 5);
      }
      if (this.options.cellMustBeHiddenOn) {
        this.startProcess(new CellMustBeHiddenProcess(towers, t.row, t.col, face, this.id), 5);
        switch (face) {
          case HintFace.NORTH:
            for (let i = t.row + 1; i < towers.n; ++ i) {
              this.startProcess(new CellMustBeHiddenProcess(towers, i, t.col, face, this.id), 5);
            }
            break;
          case HintFace.SOUTH:
            for (let i = 0; i < t.row; ++ i) {
              this.startProcess(new CellMustBeHiddenProcess(towers, i, t.col, face, this.id), 5);
            }
            break;
          case HintFace.WEST:
            for (let i = t.col + 1; i < towers.n; ++ i) {
              this.startProcess(new CellMustBeHiddenProcess(towers, t.row, i, face, this.id), 5);
            }
            break;
          case HintFace.EAST:
            for (let i = 0; i < t.col; ++ i) {
              this.startProcess(new CellMustBeHiddenProcess(towers, t.row, i, face, this.id), 5);
            }
            break;
        }
      }
      if (this.options.heightMustBeHiddenOn) {
        this.startProcess(new TowerMustBeHiddenProcess(towers, t.val, rowIndex, face, this.id), 5);
        for (let i = 0; i < t.val; ++i) {
          this.startProcess(new TowerMustBeHiddenProcess(towers, i, rowIndex, face, this.id), 5);
        }
      }

      if (isVertical(face)) {
        if (this.options.detectVisibilityOn) {
          this.startProcess(new CheckPossibilityVisibilityProcess(towers, face, t.col, this.id), 7);
        }
        this.recheckVisibility(towers, t.col, face);
      } else {
        if (this.options.detectVisibilityOn) {
          this.startProcess(new CheckPossibilityVisibilityProcess(towers, face, t.row, this.id), 7);
        }
        this.recheckVisibility(towers, t.row, face);
      }
    }
  }

  private recheckVisibility(t: Towers, rowIndex: number, face: HintFace) {
    if (this.options.cellVisibilityCountOn) {
      this.startProcess(new CheckCellSeenHiddenCountProcess(t, face, rowIndex, this.id), 5);
    }
    if (this.options.heightVisibilityCountOn) {
      this.startProcess(new CheckTowerSeenHiddenCountProcess(t, face, rowIndex, true, this.id), 5);
    }
  }

  private onVisibilityChanged(towers: Towers, a: VisibilityAction) {
    if (this.options.removeContradictoryVisibilityOn) {
      const p = new RemovePossibilityWithContradictoryVisibilityProcess(towers, {row: a.row, col: a.col, val: a.val}, a.face, this.id);
      this.startProcess(p, 9);
    }
    if (isVertical(a.face)) {
      this.recheckVisibility(towers, a.col, a.face);
    } else {
      this.recheckVisibility(towers, a.row, a.face);
    }
    if (this.options.cellMustBeSeenOn) {
      this.startProcess(new CellMustBeSeenProcess(towers, a.row, a.col, a.face, this.id), 5);
    }
    if (this.options.cellMustBeHiddenOn) {
      this.startProcess(new CellMustBeHiddenProcess(towers, a.row, a.col, a.face, this.id), 5);
    }
    const rowIndex = isVertical(a.face) ? a.col : a.row;
    if (this.options.heightMustBeSeenOn) {
      this.startProcess(new TowerMustBeSeenProcess(towers, a.val, rowIndex, a.face, this.id), 5);
    }
    if (this.options.heightMustBeHiddenOn) {
      this.startProcess(new TowerMustBeHiddenProcess(towers, a.val, rowIndex, a.face, this.id), 5);
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
          const p = new SimpleViewProcess(t, face,
            this.upgrades.betterSimpleViewProcess.isUnlocked,
            this.upgrades.tooShortTooFarUpgrade.isUnlocked,
            this.upgrades.markHintSatisfied.isUnlocked,
            this.upgrades.twosViewUpgrade.isUnlocked,
            this.id
          );
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
