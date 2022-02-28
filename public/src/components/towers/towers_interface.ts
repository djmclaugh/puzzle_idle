import Vue from '../../vue.js'
import Towers, {HintFace, Action, ActionType, TowersContradiction, isRowContradiction, isColumnContradiction} from '../../puzzles/towers/towers.js'
import TowersOptionsComponent from './towers_options.js'
import TowersComponent from './towers.js'
import TowersValidatorComponent from './towers_validator.js'
import InterfaceStatusComponent, {InterfaceHandlers} from '../interface_status.js'
import { currentStatus } from '../../data/status.js'
import { currentCPU } from '../../data/cpu.js'
import { randomOfSize } from '../../puzzles/towers/towers_loader.js'
import Process from '../../data/process.js'
import RandomGuessProcess from '../../data/processes/towers/random_guess_process.js'
import SimpleViewProcess from '../../data/processes/towers/simple_view_process.js'
import OnlyChoiceInColumnProcess from '../../data/processes/towers/check_only_choice_in_column_process.js'
import OnlyChoiceInRowProcess from '../../data/processes/towers/check_only_choice_in_row_process.js'
import RemoveFromColumnProcess from '../../data/processes/towers/remove_from_column_process.js'
import RemoveFromRowProcess from '../../data/processes/towers/remove_from_row_process.js'
import ValidationProcess from '../../data/processes/towers/validation_process.js'
import FollowSetImplicationsProcess from '../../data/processes/towers/follow_set_implications_process.js'
import FollowRemovalImplicationsProcess from '../../data/processes/towers/follow_removal_implications_process.js'
import TowersOptions from '../../data/towers/towers_options.js'
import {towersUpgrades} from '../../data/towers/towers_upgrades.js'

interface InterfaceComponentProps {
  interfaceId: number,
}

interface InterfaceComponentData {
  currentPuzzle: Towers,
  autoUniqueImplications: boolean,
  autoSweep: boolean, // Need to find better name...,
  autoImply: boolean,
  autoFollowImply: boolean,
  backgrounds: {cell: [number, number], colour: string}[],
  // Processes that require special handling
  validationProcess: ValidationProcess|null;
  randomGuessProcess: RandomGuessProcess|null;
  otherProcesses: Set<Process<any>>;
}

let puzzleUUID: number = 0;

export default {
  props: ['interfaceId'],
  setup(props: InterfaceComponentProps): any {
    const options: TowersOptions = Vue.reactive(new TowersOptions());
    const data: InterfaceComponentData = Vue.reactive({
      currentPuzzle: {},
      autoView: false,
      autoUniqueImplications: false,
      autoImply: false,
      autoFollowImply: false,
      autoSweep: false,
      activeProcesses: new Set(),
      backgrounds: [],
      validationProcess: null,
      randomGuessProcess: null,
      otherProcesses: new Set(),
    });

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

      data.backgrounds = [];
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
      data.validationProcess.onTick(() => {
        if (data.validationProcess) {
          data.backgrounds = data.validationProcess.getBackgrounds();
        }
      });
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
        if (options.simpleViewOn) {
          for (const face of [HintFace.NORTH, HintFace.EAST, HintFace.SOUTH, HintFace.WEST]) {
            const p = new SimpleViewProcess(data.currentPuzzle, face, props.interfaceId);
            startProcess(p, 9);
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
      data.otherProcesses.add(p);
      currentCPU.addProcess(p, priority, onProcessOver(p));
    }

    function onProcessOver<R>(process: Process<R>) {
      return () => {
        data.otherProcesses.delete(process);
        startRandomGuessProcessIfNeeded();
      }
    }

    async function cashIn() {
      currentStatus.puzzleCompleted(options.currentSize);
      await assignNewPuzzle()
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
      if (data.autoFollowImply) {
        const triple = { row: row, col: col, val: val };
        const p = new FollowRemovalImplicationsProcess(data.currentPuzzle, triple, props.interfaceId);
        currentCPU.addProcess(p, 9, onProcessOver(p));
      }
      if (data.autoSweep) {
        const colP = new OnlyChoiceInColumnProcess(data.currentPuzzle, col, val, props.interfaceId);
        currentCPU.addProcess(colP, 9, onProcessOver(colP));
        const rowP = new OnlyChoiceInRowProcess(data.currentPuzzle, row, val, props.interfaceId);
        currentCPU.addProcess(rowP, 9, onProcessOver(rowP));
      }
      if (data.autoImply) {
        const rowCol = data.currentPuzzle.marks.getWithRowCol(row, col);
        if (rowCol.size == 2) {
          const iter = rowCol.values();
          const t1 = { row: row, col: col, val: iter.next().value };
          const t2 = { row: row, col: col, val: iter.next().value };
          data.currentPuzzle.addOffToOnImplication(t1, t2);
        }

        const rowVal = data.currentPuzzle.marks.getWithRowVal(row, val);
        if (rowVal.size == 2) {
          const iter = rowVal.values();
          const t1 = { row: row, col: iter.next().value, val: val };
          const t2 = { row: row, col: iter.next().value, val: val };
          data.currentPuzzle.addOffToOnImplication(t1, t2)
        }

        const colVal = data.currentPuzzle.marks.getWithColVal(col, val);
        if (colVal.size == 2) {
          const iter = colVal.values();
          const t1 = { row: iter.next().value, col: col, val: val };
          const t2 = { row: iter.next().value, col: col, val: val };
          data.currentPuzzle.addOffToOnImplication(t1, t2)
        }
      }
    }

    async function assignNewPuzzle() {
      stopAllProcesses();

      data.currentPuzzle = await randomOfSize(options.currentSize);
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
        startRandomGuessProcessIfNeeded();
      });

      puzzleUUID += 1;
      startInitialRemovalProcessIfNeeded();
      startRandomGuessProcessIfNeeded();
    }

    Vue.onMounted(async () => {
      await assignNewPuzzle();
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
        undoUnlocked: towersUpgrades.undoUnlocked,
        guessUnlocked: towersUpgrades.guessUnlocked,
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
        interactive: true,
      }
      if (data.validationProcess) {
        towersProps.interactive = false;
        towersProps.backgrounds = data.backgrounds;
      } else if (data.currentPuzzle.hasContradiction) {
        let c: TowersContradiction = data.currentPuzzle.getContradiction()!;
        if (isRowContradiction(c)) {
          towersProps.backgrounds = [
            {cell: [c.col1, c.row], colour: '#ffc0c0f0'},
            {cell: [c.col2, c.row], colour: '#ffc0c0f0'},
          ];
        } else if (isColumnContradiction(c)) {
          towersProps.backgrounds = [
            {cell: [c.col, c.row1], colour: '#ffc0c0f0'},
            {cell: [c.col, c.row2], colour: '#ffc0c0f0'},
          ];
        } else {
          console.log("Unknown contradiction type: " + JSON.stringify(c));
        }
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

      return Vue.h('details', {open: true, class: 'towers-interface'}, [
        Vue.h('summary', {}, 'Towers ' + (props.interfaceId + 1)),
        Vue.h('div', {}, items),
      ]);
    };
  }
}
