import Vue from '../vue.js'
import Towers, {HintFace, Action, ActionType} from '../puzzles/towers/towers.js'
import TowersComponent from '../components/towers.js'
import TowersValidatorComponent from '../components/towers_validator.js'
import InterfaceStatusComponent, {InterfaceHandlers} from '../components/interface_status.js'
import { currentStatus } from '../data/status.js'
import { randomOfSize } from '../puzzles/towers/towers_loader.js'
import Process from '../data/process.js'
import RandomRemovalProcess from '../data/processes/random_removal_process.js'
import SimpleViewProcess from '../data/processes/simple_view_process.js'
import OnlyChoiceInColumnProcess from '../data/processes/check_only_choice_in_column_process.js'
import OnlyChoiceInRowProcess from '../data/processes/check_only_choice_in_row_process.js'
import RemovalProcess from '../data/processes/removal_process.js'
import ValidationProcess from '../data/processes/validation_process.js'
import LabeledCheckbox from './util/labeled_checkbox.js'

interface InterfaceComponentProps {
  interfaceId: number,
  isCurrent: boolean,
}

interface InterfaceComponentData {
  currentPuzzle: Towers,
  validating: boolean,
  autoValidate: boolean,
  autoCashIn: boolean,
  autoRestart: boolean,
  autoView: boolean,
  autoUnique: boolean,
  autoSweep: boolean, // Need to find better name...
  autoRandom: boolean,
  autoRevertOnContradiction: boolean,
  inGuessMode: boolean,
  isDone: boolean,
  isCorrect: boolean,
  validationProcess: ValidationProcess|null,
  activeProcesses: Set<Process<any>>
}

let puzzleUUID: number = 0;

export default {
  props: ['interfaceId', 'isCurrent'],
  setup(props: InterfaceComponentProps): any {
    const data: InterfaceComponentData = Vue.reactive({
      currentPuzzle: {},
      validating: false,
      autoValidate: true,
      autoCashIn: true,
      autoRestart: true,
      autoView: true,
      autoUnique: true,
      autoRandom: true,
      autoRevertOnContradiction: true,
      autoSweep: true,
      inGuessMode: false,
      isDone: false,
      isCorrect: false,
      activeProcesses: new Set(),
    });

    function size(): number {
      return currentStatus.interfacesCurrentSize[props.interfaceId];
    }

    function stopAllProcesses() {
      data.activeProcesses.forEach(p => currentStatus.cpu.killProcess(p));
      data.activeProcesses.clear();
      data.validationProcess = null;
    }

    function restart(): void {
      stopAllProcesses()
      data.validating = false;
      data.isCorrect = false;
      data.isDone = false;
      data.inGuessMode = false;
      data.currentPuzzle.restart();
      startInitialRemovalProcessIfNeeded();
      startRandomRemovalProcessIfNeeded();
    }

    function revert(): void {
      stopAllProcesses()
      data.validating = false;
      data.isCorrect = false;
      data.isDone = false;
      data.currentPuzzle.restoreLatestSnapshot();
      data.inGuessMode = false;
      startInitialRemovalProcessIfNeeded();
      startRandomRemovalProcessIfNeeded();
    }

    function startValidate(): void {
      stopAllProcesses();
      data.validating = true;
      data.isDone = false;
      data.isCorrect = false;
      data.validationProcess = new ValidationProcess(data.currentPuzzle, props.interfaceId);
      data.activeProcesses.add(data.validationProcess);
      currentStatus.cpu.addProcess(data.validationProcess, 10, (isValid: boolean) => {
        data.isDone = true;
        data.isCorrect = isValid;
        data.activeProcesses.delete(data.validationProcess!);
        if (data.isCorrect && data.autoCashIn) {
          cashIn();
        } else if (!data.isCorrect && data.autoRestart) {
          revert();
        }
      });
    }

    function startInitialRemovalProcessIfNeeded() {
      if (data.currentPuzzle.history.length == 0) {
        if (data.autoView) {
          for (const face of [HintFace.NORTH, HintFace.EAST, HintFace.SOUTH, HintFace.WEST]) {
            for (let i = 0; i < data.currentPuzzle.n; ++i) {
              const p = new SimpleViewProcess(data.currentPuzzle, face, i, props.interfaceId);
              if (currentStatus.cpu.addProcess(p, 9, () => { data.activeProcesses.delete(p) })) {
                data.activeProcesses.add(p);
              }
            }
          }
        }
        if (data.autoUnique) {
          for (let row = 0; row < data.currentPuzzle.n; ++row) {
            for (let col = 0; col < data.currentPuzzle.n; ++col) {
              const possibilities = data.currentPuzzle.marksCell(row, col);
              if (possibilities.size == 1) {
                const v: number = possibilities.values().next().value;
                for (let i = 0; i < data.currentPuzzle.n; ++i) {
                  if (i != row) {
                    const p = new RemovalProcess(data.currentPuzzle, i, col, v, props.interfaceId);
                    if (currentStatus.cpu.addProcess(p, 9, onProcessOver(p))) {
                      data.activeProcesses.add(p);
                    }
                  }
                  if (i != col) {
                    const p = new RemovalProcess(data.currentPuzzle, row, i, v, props.interfaceId);
                    if (currentStatus.cpu.addProcess(p, 9, onProcessOver(p))) {
                      data.activeProcesses.add(p);
                    }
                  }
                }
              }
            }
          }
        }
      }
    }

    function startRandomRemovalProcessIfNeeded() {
      if (data.autoRandom && data.activeProcesses.size == 0 && !data.currentPuzzle.isReadyForValidation && !data.currentPuzzle.hasContradiction) {
        if (!data.inGuessMode) {
          data.currentPuzzle.takeSnapshot();
          data.inGuessMode = true;
        }
        const p = new RandomRemovalProcess(data.currentPuzzle, props.interfaceId);
        if (currentStatus.cpu.addProcess(p, 5, onProcessOver(p))) {
          data.activeProcesses.add(p);
        }
      }
    }

    function onProcessOver<R>(process: Process<R>) {
      return () => {
        data.activeProcesses.delete(process);
        startRandomRemovalProcessIfNeeded();
      }
    }

    async function cashIn() {
      currentStatus.puzzleCompleted(size());
      await assignNewPuzzle()
    }

    async function assignNewPuzzle() {
      data.validating = false;
      data.isCorrect = false;
      data.isDone = false;
      data.inGuessMode = false;

      stopAllProcesses();

      data.currentPuzzle = await randomOfSize(size());
      data.currentPuzzle.onAction((a: Action) => {
        if (data.currentPuzzle.hasContradiction) {
          stopAllProcesses();
          if (data.inGuessMode && data.autoRevertOnContradiction) {
            data.currentPuzzle.restoreLatestSnapshot();
            data.inGuessMode = false;
          }
          startRandomRemovalProcessIfNeeded();
          return;
        }
        if (data.autoUnique && a.type == ActionType.REMOVE_POSSIBILITY) {
          const cell = data.currentPuzzle.marksCell(a.row, a.column);
          if (cell.size == 1) {
            const v: number = cell.values().next().value;
            for (let i = 0; i < data.currentPuzzle.n; ++i) {
              if (i != a.column) {
                const p = new RemovalProcess(data.currentPuzzle, a.row, i, v, props.interfaceId);
                if (currentStatus.cpu.addProcess(p, 9, onProcessOver(p))) {
                  data.activeProcesses.add(p);
                }
              }
              if (i != a.row) {
                const p = new RemovalProcess(data.currentPuzzle, i, a.column, v, props.interfaceId);
                if (currentStatus.cpu.addProcess(p, 9, onProcessOver(p))) {
                  data.activeProcesses.add(p);
                }
              }
            }
          }
        }
        if (data.autoSweep && a.type == ActionType.REMOVE_POSSIBILITY) {
          const colP = new OnlyChoiceInColumnProcess(data.currentPuzzle, a.column, a.value, props.interfaceId);
          if (currentStatus.cpu.addProcess(colP, 9, onProcessOver(colP))) {
            data.activeProcesses.add(colP);
          }
          const rowP = new OnlyChoiceInRowProcess(data.currentPuzzle, a.row, a.value, props.interfaceId);
          if (currentStatus.cpu.addProcess(rowP, 9, onProcessOver(rowP))) {
            data.activeProcesses.add(rowP);
          }
        }
        if (data.currentPuzzle.isReadyForValidation && data.autoValidate && !data.validating) {
          startValidate();
        }
      });

      puzzleUUID += 1;
      startInitialRemovalProcessIfNeeded();
      startRandomRemovalProcessIfNeeded();
    }

    Vue.onMounted(async () => {
      await assignNewPuzzle();
    })

    return () => {
      if (!props.isCurrent) {
        return Vue.h('div', {hidden: true});
      }
      let items = [];

      const interfaceProps: any = {
        interfaceId: props.interfaceId,
        inGuessMode: data.inGuessMode,
        isValidating: data.validating,
        isDone: data.isDone,
        isCorrect: data.isCorrect,
        puzzle: data.currentPuzzle,
      }
      interfaceProps[InterfaceHandlers.UPGRADE] = async () => {
        currentStatus.upgradeInterface(props.interfaceId);
        await assignNewPuzzle();
      }
      interfaceProps[InterfaceHandlers.RESTART] = restart;
      interfaceProps[InterfaceHandlers.START_VALIDATE] = startValidate;
      interfaceProps[InterfaceHandlers.STOP_VALIDATE] = async () => {
        data.validating = false;
        if (data.validationProcess) {
          data.activeProcesses.delete(data.validationProcess);
          currentStatus.cpu.killProcess(data.validationProcess);
          data.validationProcess = null;
        }
        if (data.isCorrect) {
          await cashIn();
        }
      }
      interfaceProps[InterfaceHandlers.UNDO] = () => {
        data.currentPuzzle.undo();
        // If we "undo"ed past the guess mode snapshot, exit guess mode.
        if (data.inGuessMode && data.currentPuzzle.snapshots.length == 0) {
          data.inGuessMode = false;
        }
      }
      interfaceProps[InterfaceHandlers.GUESS_MODE] = () => {
        if (data.inGuessMode) {
          data.currentPuzzle.restoreLatestSnapshot();
        } else {
          data.currentPuzzle.takeSnapshot();
        }
        data.inGuessMode = !data.inGuessMode;
      }
      const interfaceStatus = Vue.h(InterfaceStatusComponent, interfaceProps)
      items.push(interfaceStatus);

      items.push(Vue.h('br'));
      items.push(Vue.h('br'));

      const autoValidate = Vue.h(LabeledCheckbox, {
        value: data.autoValidate,
        label: 'Auto Validate',
        boxId: 'auto_validate_checkbox',
        onChange: (e: Event) => {
          const t: HTMLInputElement = e.target as HTMLInputElement;
          data.autoValidate = t.checked;
        }
      });
      items.push(autoValidate);

      const autoCashIn = Vue.h(LabeledCheckbox, {
        value: data.autoCashIn,
        label: 'Auto Cash In',
        boxId: 'auto_cashin_checkbox',
        onChange: (e: Event) => {
          const t: HTMLInputElement = e.target as HTMLInputElement;
          data.autoCashIn = t.checked;
        }
      });
      items.push(autoCashIn);

      const autoRestart = Vue.h(LabeledCheckbox, {
        value: data.autoRestart,
        label: 'Auto Revert On Failed Validation',
        boxId: 'auto_restart_checkbox',
        onChange: (e: Event) => {
          const t: HTMLInputElement = e.target as HTMLInputElement;
          data.autoRestart = t.checked;
        }
      });
      items.push(autoRestart);

      const autoRevertOnContradiction = Vue.h(LabeledCheckbox, {
        value: data.autoRevertOnContradiction,
        label: 'Auto Revert On Contradiciton',
        boxId: 'auto_revert_on_contradiction_checkbox',
        onChange: (e: Event) => {
          const t: HTMLInputElement = e.target as HTMLInputElement;
          data.autoRevertOnContradiction = t.checked;
        }
      });
      items.push(autoRevertOnContradiction);

      const autoView = Vue.h(LabeledCheckbox, {
        value: data.autoView,
        label: 'Auto View Process',
        boxId: 'auto_view_checkbox',
        onChange: (e: Event) => {
          const t: HTMLInputElement = e.target as HTMLInputElement;
          data.autoView = t.checked;
        }
      });
      items.push(autoView);

      const autoUnique = Vue.h(LabeledCheckbox, {
        value: data.autoUnique,
        label: 'Automatically remove possibility once found in same row/column',
        boxId: 'auto_unique_checkbox',
        onChange: (e: Event) => {
          const t: HTMLInputElement = e.target as HTMLInputElement;
          data.autoUnique = t.checked;
        }
      });
      items.push(autoUnique);

      const autoSweep = Vue.h(LabeledCheckbox, {
        value: data.autoSweep,
        label: 'Automatically check if only one cell in a row/column can be a certain value',
        boxId: 'auto_sweep_checkbox',
        onChange: (e: Event) => {
          const t: HTMLInputElement = e.target as HTMLInputElement;
          data.autoSweep = t.checked;
        }
      });
      items.push(autoSweep);

      const autoRandom = Vue.h(LabeledCheckbox, {
        value: data.autoRandom,
        label: 'Auto Random Selection',
        boxId: 'auto_randomselection_checkbox',
        onChange: (e: Event) => {
          const t: HTMLInputElement = e.target as HTMLInputElement;
          data.autoRandom = t.checked;
          startRandomRemovalProcessIfNeeded();
        }
      });
      items.push(autoRandom);

      const towersProps: any = {
        key: 'puzzle-' + puzzleUUID,
        puzzle: data.currentPuzzle,
        interactive: true,
      }
      if (data.validationProcess) {
        towersProps.interactive = false;
        towersProps.backgrounds = data.validationProcess.getBackgrounds();
      }
      const p = Vue.h(TowersComponent, towersProps);
      items.push(p);

      data.activeProcesses.forEach((p) => {
        const line = Vue.h('p', {}, p.processId);
        items.push(line);
      })

      if (data.validationProcess) {
        const validator = Vue.h(TowersValidatorComponent, {
          process: data.validationProcess,
        });
        items.push(validator);
      } else {
        // Nothing for now
      }

      return Vue.h('div', {}, items);
    }
  }
};
