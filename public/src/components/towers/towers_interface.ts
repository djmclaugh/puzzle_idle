import Vue from '../../vue.js'
import {fromSimonThatamId, toSimonTathamId} from '../../puzzles/towers/util.js'
import Towers, {Action, ActionType} from '../../puzzles/towers/towers.js'
import {HintFace, isVertical, ALL_FACES} from '../../puzzles/towers/hint_face.js'
import TowersOptionsComponent from './towers_options.js'
import TowersComponent from './towers.js'
import TowersValidatorComponent from './towers_validator.js'
import InterfaceStatusComponent, {InterfaceHandlers} from '../interface_status.js'
import { currentStatus } from '../../data/status.js'
import { currentCPU } from '../../data/cpu.js'
import { randomOfSize, loadTowers } from '../../puzzles/towers/towers_loader.js'
import Process from '../../data/process.js'
import RandomGuessProcess from '../../data/processes/towers/random_guess_process.js'
import OneViewProcess from '../../data/processes/towers/visibility/one_view_process.js'
import NotOneViewProcess from '../../data/processes/towers/visibility/not_one_view_process.js'
import DetectCellVisibilityProcess from '../../data/processes/towers/visibility/detect_cell_visibility_process.js'
import CellMustBeSeenProcess from '../../data/processes/towers/visibility/cell_must_be_seen_process.js'
import CellMustBeHiddenProcess from '../../data/processes/towers/visibility/cell_must_be_hidden_process.js'
import CheckCellSeenHiddenCount from '../../data/processes/towers/visibility/check_cell_seen_hidden_count_process.js'
import {
  TowersSeenHiddenForSureProcess,
  TowersSeenForSureProcess,
  TowersHiddenForSureProcess,
} from '../../data/processes/towers/visibility/towers_seen_hidden_for_sure_process.js'
import MaxViewProcess from '../../data/processes/towers/visibility/max_view_process.js'
import BetterSimpleViewProcess from '../../data/processes/towers/visibility/better_simple_view_process.js'
import SimpleViewProcess from '../../data/processes/towers/visibility/simple_view_process.js'
import OnlyChoiceInColumnProcess from '../../data/processes/towers/latin/only_choice_in_column_process.js'
import OnlyChoiceInRowProcess from '../../data/processes/towers/latin/only_choice_in_row_process.js'
import RemoveFromColumnProcess from '../../data/processes/towers/latin/remove_from_column_process.js'
import RemoveFromRowProcess from '../../data/processes/towers/latin/remove_from_row_process.js'
import ValidationProcess from '../../data/processes/towers/validation_process.js'
import FollowSetImplicationsProcess from '../../data/processes/towers/follow_set_implications_process.js'
import TowersOptions from '../../data/towers/towers_options.js'
import {towersUpgrades} from '../../data/towers/towers_upgrades.js'

interface InterfaceComponentProps {
  interfaceId: number,
}

interface InterfaceComponentData {
  currentPuzzle: Towers,
  autoUniqueImplications: boolean,
  autoImply: boolean,
  autoFollowImply: boolean,
  // Processes that require special handling
  validationProcess: ValidationProcess|null;
  randomGuessProcess: RandomGuessProcess|null;
  otherProcesses: Set<Process<any>>;
}

let puzzleUUID: number = 0;

export default {
  props: ['interfaceId'],
  setup(props: InterfaceComponentProps) {
    const options: TowersOptions = Vue.reactive(new TowersOptions());
    const data: InterfaceComponentData = Vue.reactive({
      currentPuzzle: {},
      autoView: false,
      autoUniqueImplications: false,
      autoImply: false,
      autoFollowImply: false,
      activeProcesses: new Set(),
      validationProcess: null,
      randomGuessProcess: null,
      otherProcesses: new Set(),
    });

    const incomeTracker: [number, number][] = [];
    const averages: {minute: number, tenMinute: number, hour: number} = Vue.reactive({
      minute: 0,
      tenMinute: 0,
      hour: 0,
    });

    let updateAverageTimeoutId = setTimeout(updateAverages, 2000);
    function updateAverages() {
      // If this was explictly called, cancel the timeout
      clearTimeout(updateAverageTimeoutId)
      const now = Date.now();
      const minuteAgo = now - (60 * 1000)
      const tenMinutesAgo = now - (10 * 60 * 1000)
      const hourAgo = now - (60 * 60 * 1000)

      let minuteSum = 0;
      let tenMinutesSum = 0;
      let hourSum = 0;

      let firstRelevantIndex = -1;
      for (let i = 0; i < incomeTracker.length; ++i) {
        if (firstRelevantIndex == -1 && incomeTracker[i][0] > hourAgo) {
          firstRelevantIndex = i;
        }
        if (firstRelevantIndex != -1) {
          hourSum += incomeTracker[i][1];
          if (incomeTracker[i][0] > tenMinutesAgo) {
            tenMinutesSum += incomeTracker[i][1];
            if (incomeTracker[i][0] > minuteAgo) {
              minuteSum += incomeTracker[i][1];
            }
          }
        }
      }

      if (firstRelevantIndex == -1) {
        incomeTracker.splice(0, incomeTracker.length);
      }
      incomeTracker.splice(0, firstRelevantIndex);

      averages.minute = minuteSum;
      averages.tenMinute = tenMinutesSum / 10;
      averages.hour = hourSum / 60;

      // Update in 2 seconds
      updateAverageTimeoutId = setTimeout(updateAverages, 2000);
    }

    function stopAllProcesses() {
      if (data.validationProcess) {
        currentCPU.killProcess(data.validationProcess);
        data.validationProcess = null;
      }
      if (data.randomGuessProcess) {
        currentCPU.killProcess(data.randomGuessProcess);
        data.randomGuessProcess = null;
      }
      for (const p of data.otherProcesses) {
        currentCPU.killProcess(p);
      }
      data.otherProcesses.clear();
    }

    function hasProcessRunning(): boolean {
      return data.validationProcess !== null || data.randomGuessProcess !== null || data.otherProcesses.size > 0;
    }

    function restart(): void {
      stopAllProcesses();
      data.currentPuzzle.restart();
      startInitialRemovalProcessIfNeeded();
      startRandomGuessProcessIfNeeded();
    }

    function revert(): void {
      stopAllProcesses();
      if (data.currentPuzzle.guesses.length == 0) {
        data.currentPuzzle.restart();
      } else {
        data.currentPuzzle.markGuessAsImpossible();
      }
      startInitialRemovalProcessIfNeeded();
      startRandomGuessProcessIfNeeded();
    }

    function startValidate(): void {
      stopAllProcesses();
      data.validationProcess = new ValidationProcess(data.currentPuzzle, props.interfaceId);

      currentCPU.addProcess(data.validationProcess, 10, (isValid: boolean) => {
        if (isValid && options.autoCashInOn) {
          cashIn();
        } else if (!isValid && options.autoRevertOnContradiction) {
          revert();
        }
      });
    }

    async function stopValidate() {
      if (data.validationProcess) {
        if (data.validationProcess.returnValue) {
          cashIn();
        } else {
          stopAllProcesses();
        }
      }
    }

    function startInitialRemovalProcessIfNeeded() {
      if (data.currentPuzzle.history.length == 0) {
        if (towersUpgrades.simpleViewProcess.isUnlocked) {
          if (options.simpleViewOn) {
            for (const face of [HintFace.NORTH, HintFace.EAST, HintFace.SOUTH, HintFace.WEST]) {
              const p = towersUpgrades.betterSimpleViewProcess.isUnlocked ?
                  new BetterSimpleViewProcess(data.currentPuzzle, face, props.interfaceId) :
                  new SimpleViewProcess(data.currentPuzzle, face, props.interfaceId);
              startProcess(p, 9);
            }
          }
        } else {
          if (options.maxViewOn) {
            for (const face of [HintFace.NORTH, HintFace.EAST, HintFace.SOUTH, HintFace.WEST]) {
              const p = new MaxViewProcess(data.currentPuzzle, face, props.interfaceId);
              startProcess(p, 9);
            }
          }
          if (options.oneViewOn) {
            for (const face of [HintFace.NORTH, HintFace.EAST, HintFace.SOUTH, HintFace.WEST]) {
              const p = new OneViewProcess(data.currentPuzzle, face, props.interfaceId);
              startProcess(p, 9);
            }
          }
          if (options.notOneViewOn) {
            for (const face of [HintFace.NORTH, HintFace.EAST, HintFace.SOUTH, HintFace.WEST]) {
              const p = new NotOneViewProcess(data.currentPuzzle, face, props.interfaceId);
              startProcess(p, 9);
            }
          }
        }
        if (options.removeOnSetOn) {
          for (let row = 0; row < data.currentPuzzle.n; ++row) {
            for (let col = 0; col < data.currentPuzzle.n; ++col) {
              const possibilities = data.currentPuzzle.marksCell(row, col);
              if (possibilities.size == 1) {
                const val: number = possibilities.values().next().value;
                const pCol = new RemoveFromColumnProcess(data.currentPuzzle, val, col, row, props.interfaceId);
                startProcess(pCol, 9);
                const pRow = new RemoveFromRowProcess(data.currentPuzzle, val, row, col, props.interfaceId);
                startProcess(pRow, 9);
              }
            }
          }
        }
      }
    }

    function startRandomGuessProcessIfNeeded() {
      if (options.randomGuessOn && !hasProcessRunning() && !data.currentPuzzle.isReadyForValidation() && !data.currentPuzzle.hasContradiction) {
        data.randomGuessProcess = new RandomGuessProcess(data.currentPuzzle, props.interfaceId);
        currentCPU.addProcess(data.randomGuessProcess, 5, () => {
          data.randomGuessProcess = null;
          Vue.nextTick(() => { startRandomGuessProcessIfNeeded(); });
        });
      }
    }

    function startProcess(p: Process<any>, priority: number) {
      if (currentCPU.addProcess(p, priority, onProcessOver(p))) {
        data.otherProcesses.add(p);
      }
    }

    function onProcessOver<R>(process: Process<R>) {
      return () => {
        data.otherProcesses.delete(process);
        startRandomGuessProcessIfNeeded();
      }
    }

    function cashIn() {
      incomeTracker.push([Date.now(), currentStatus.puzzleReward(options.currentSize)]);
      currentStatus.puzzleCompleted(options.currentSize);
      updateAverages();
      assignNewPuzzle()
    }

    function onPossibilitySet(row: number, col: number, val: number) {
      if (data.autoFollowImply) {
        const triple = { row: row, col: col, val: val };
        const p = new FollowSetImplicationsProcess(data.currentPuzzle, triple, props.interfaceId);
        currentCPU.addProcess(p, 9, onProcessOver(p));
      }
      if (options.removeOnSetOn) {
        const pCol = new RemoveFromColumnProcess(data.currentPuzzle, val, col, row, props.interfaceId);
        startProcess(pCol, 9);
        const pRow = new RemoveFromRowProcess(data.currentPuzzle, val, row, col, props.interfaceId);
        startProcess(pRow, 9);
      }
    }

    function onPossibilityRemoved(row: number, col: number, val: number) {
      // if (data.autoFollowImply) {
      //   const triple = { row: row, col: col, val: val };
      //   const p = new FollowRemovalImplicationsProcess(data.currentPuzzle, triple, props.interfaceId);
      //   currentCPU.addProcess(p, 9, onProcessOver(p));
      // }
      if (options.onlyInRowColumnOn) {
        const colP = new OnlyChoiceInColumnProcess(data.currentPuzzle, col, val, props.interfaceId);
        startProcess(colP, 8);
        const rowP = new OnlyChoiceInRowProcess(data.currentPuzzle, row, val, props.interfaceId);
        startProcess(rowP, 8);
      }

      if (towersUpgrades.positionsSeenHiddenForSureProcess.isUnlocked) {
        if (options.positionVisibilityOn) {
          for (const p of DetectCellVisibilityProcess.processesForCell(data.currentPuzzle, row, col, props.interfaceId, true, true)) {
            startProcess(p, 7);
          }
          for (let i = 0; i < data.currentPuzzle.n; ++i) {
            for (const face of ALL_FACES) {
              if (isVertical(face)) {
                const info = data.currentPuzzle.visibility.getWithRowCol(i, col)[face];
                if (info.seen) {
                  const p = new CellMustBeSeenProcess(data.currentPuzzle, i, col, face, props.interfaceId);
                  startProcess(p, 6);
                }
                if (info.hidden) {
                  const p = new CellMustBeHiddenProcess(data.currentPuzzle, i, col, face, props.interfaceId);
                  startProcess(p, 6);
                }
              } else {
                const info = data.currentPuzzle.visibility.getWithRowCol(row, i)[face];
                if (info.seen) {
                  const p = new CellMustBeSeenProcess(data.currentPuzzle, row, i, face, props.interfaceId);
                  startProcess(p, 6);
                }
                if (info.hidden) {
                  const p = new CellMustBeHiddenProcess(data.currentPuzzle, row, i, face, props.interfaceId);
                  startProcess(p, 6);
                }
              }
            }
          }
        }
      }

      if (towersUpgrades.towersSeenHiddenForSureProcess.isUnlocked) {
        if (options.towerVisibilityOn) {
          for (const p of TowersSeenHiddenForSureProcess.processesForCell(data.currentPuzzle, row, col, props.interfaceId)) {
            startProcess(p, 7);
          }
        }
      } else {
        if (options.towersSeenForSureOn) {
          for (const p of TowersSeenForSureProcess.processesForCell(data.currentPuzzle, row, col, props.interfaceId)) {
            startProcess(p, 7);
          }
        }
        if (options.towersHiddenForSureOn) {
          for (const p of TowersHiddenForSureProcess.processesForCell(data.currentPuzzle, row, col, props.interfaceId)) {
            startProcess(p, 7);
          }
        }
      }
      // if (data.autoImply) {
      //   const rowCol = data.currentPuzzle.marks.getWithRowCol(row, col);
      //   if (rowCol.size == 2) {
      //     const iter = rowCol.values();
      //     const t1 = { row: row, col: col, val: iter.next().value };
      //     const t2 = { row: row, col: col, val: iter.next().value };
      //     data.currentPuzzle.addOffToOnImplication(t1, t2);
      //   }
      //
      //   const rowVal = data.currentPuzzle.marks.getWithRowVal(row, val);
      //   if (rowVal.size == 2) {
      //     const iter = rowVal.values();
      //     const t1 = { row: row, col: iter.next().value, val: val };
      //     const t2 = { row: row, col: iter.next().value, val: val };
      //     data.currentPuzzle.addOffToOnImplication(t1, t2)
      //   }
      //
      //   const colVal = data.currentPuzzle.marks.getWithColVal(col, val);
      //   if (colVal.size == 2) {
      //     const iter = colVal.values();
      //     const t1 = { row: iter.next().value, col: col, val: val };
      //     const t2 = { row: iter.next().value, col: col, val: val };
      //     data.currentPuzzle.addOffToOnImplication(t1, t2)
      //   }
      // }
    }

    function assignNewPuzzle(puzzleId: string = "") {
      stopAllProcesses();

      if (puzzleId == "") {
        data.currentPuzzle = randomOfSize(options.currentSize);
      } else {
        data.currentPuzzle = fromSimonThatamId(puzzleId);
      }

      console.log("New puzzle started: " + toSimonTathamId(data.currentPuzzle));

      data.currentPuzzle.onContradiction(() => {
        stopAllProcesses();
        if (options.autoRevertOnContradiction) {
          revert();
        }
      });
      data.currentPuzzle.onAction((a: Action) => {
        if (data.randomGuessProcess) {
          currentCPU.killProcess(data.randomGuessProcess);
          data.randomGuessProcess = null;
        }
        if (data.currentPuzzle.hasContradiction) {
          return;
        }
        if (data.currentPuzzle.isReadyForValidation()) {
          if (options.autoValidateOn && !data.validationProcess) {
            startValidate();
          }
          return;
        }
        if (a.type == ActionType.SET_POSSIBILITY) {
          onPossibilitySet(a.row, a.column, a.value);
          for (let val of a.previousPossibilities) {
            if (val != a.value) {
              onPossibilityRemoved(a.row, a.column, val);
            }
          }
        }
        if (a.type == ActionType.REMOVE_POSSIBILITY) {
          onPossibilityRemoved(a.row, a.column, a.value);
          const cell = data.currentPuzzle.marksCell(a.row, a.column);
          if (cell.size == 1) {
            const v: number = cell.values().next().value;
            onPossibilitySet(a.row, a.column, v);
          }
        }
        if (a.type == ActionType.SET_VISIBILITY) {
          if (a.row !== undefined && a.col !== undefined && a.val === undefined) {
            if (isVertical(a.face)) {
              const p = new CheckCellSeenHiddenCount(data.currentPuzzle, a.face, a.col, props.interfaceId);
              startProcess(p, 5);
            } else {
              const p = new CheckCellSeenHiddenCount(data.currentPuzzle, a.face, a.row, props.interfaceId);
              startProcess(p, 5);
            }
            if (a.seen) {
              const p = new CellMustBeSeenProcess(data.currentPuzzle, a.row, a.col, a.face, props.interfaceId);
              startProcess(p, 5);
            } else {
              const p = new CellMustBeHiddenProcess(data.currentPuzzle, a.row, a.col, a.face, props.interfaceId);
              startProcess(p, 5);
            }
          }
        }
        startRandomGuessProcessIfNeeded();
      });

      puzzleUUID += 1;
      startInitialRemovalProcessIfNeeded();
      startRandomGuessProcessIfNeeded();
    }

    Vue.onMounted(async () => {
      await loadTowers(2);
      loadTowers(3);
      loadTowers(4);
      loadTowers(5);
      loadTowers(6);
      loadTowers(7);
      loadTowers(8);
      loadTowers(9);
      assignNewPuzzle();
    });

    return () => {
      let items = [];

      const optionsComponent = Vue.h(TowersOptionsComponent, {
        interfaceId: props.interfaceId,
        options: options,
        onRandomGuessOn: () => { startRandomGuessProcessIfNeeded(); },
        onSizeChange: () => { assignNewPuzzle() },
      });
      items.push(optionsComponent);

      items.push(Vue.h('br'));

      const interfaceProps: any = {
        undoUnlocked: towersUpgrades.undo.isUnlocked,
        guessUnlocked: towersUpgrades.guess.isUnlocked,
        interfaceId: props.interfaceId,
        guesses: data.currentPuzzle.guesses,
        isValidating: data.validationProcess !== null,
        isDone: data.validationProcess !== null && data.validationProcess.isDone,
        isCorrect: data.validationProcess !== null && data.validationProcess.returnValue,
        size: options.currentSize,
        puzzle: data.currentPuzzle,
      }
      interfaceProps[InterfaceHandlers.RESTART] = restart;
      interfaceProps[InterfaceHandlers.START_VALIDATE] = startValidate;
      interfaceProps[InterfaceHandlers.STOP_VALIDATE] = stopValidate;
      interfaceProps[InterfaceHandlers.UNDO] = () => {
        stopAllProcesses();
        data.currentPuzzle.undo();
      };
      interfaceProps[InterfaceHandlers.ABANDON_GUESS] = () => {
        stopValidate();
        stopAllProcesses();
        data.currentPuzzle.abandonGuess();
      };
      interfaceProps[InterfaceHandlers.MARK_GUESS_AS_IMPOSSIBLE] = () => {
        stopValidate();
        stopAllProcesses();
        data.currentPuzzle.markGuessAsImpossible();
      };
      const interfaceStatus = Vue.h(InterfaceStatusComponent, interfaceProps)
      items.push(interfaceStatus);

      const towersProps: any = {
        key: 'puzzle-' + puzzleUUID,
        puzzle: data.currentPuzzle,
        validationProcess: data.validationProcess,
      }

      const flexItems: any = [];
      const towersComponent = Vue.h(TowersComponent, towersProps);
      flexItems.push(towersComponent);

      if (data.validationProcess && options.showValidation) {
        const validator = Vue.h(TowersValidatorComponent, {
          process: data.validationProcess,
        });
        flexItems.push(validator);
      }
      items.push(Vue.h('div', {
        style: {
          display: 'flex',
          'flex-wrap': 'wrap',
        }
      }, flexItems));

      if (data.currentPuzzle instanceof Towers) {
        items.push(Vue.h('span', {}, 'Puzzle ID: ' + toSimonTathamId(data.currentPuzzle)));
        items.push(Vue.h('br'));
        items.push(Vue.h('em', {}, '(compatible with Simon Tatham\'s implementation)'));
        items.push(Vue.h('br'));
        items.push(Vue.h('input', {id: 'puzzle-id-input'}, ''));
        items.push(Vue.h('button', {onclick: () => {
          const element = document.getElementById('puzzle-id-input') as HTMLInputElement;
          const id = element.value;
          assignNewPuzzle(id);
        }}, 'Import With ID'));
      }

      return Vue.h('details', {open: true, class: 'towers-interface'}, [
        Vue.h('summary', {}, [
          Vue.h('strong', {style: {display: 'inline-block'}}, `Towers ${props.interfaceId + 1}`),
          ' | ',
          Vue.h('span', {style: {display: 'inline-block'}}, `Last minute: $${averages.minute}`),
          ' | ',
          Vue.h('span', {style: {display: 'inline-block'}}, `Last 10 minutes average: $${averages.tenMinute.toFixed(2)}/min`),
          ' | ',
          Vue.h('span', {style: {display: 'inline-block'}}, `Last hour average: $${averages.hour.toFixed(2)}/min`),
        ]),
        Vue.h('div', {}, items),
      ]);
    };
  }
}
