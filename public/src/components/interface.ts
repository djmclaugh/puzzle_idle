import Vue from '../vue.js'
import Towers, {HintFace, Action, ActionType} from '../puzzles/towers/towers.js'
import TowersComponent from '../components/towers.js'
import TowersValidatorComponent from '../components/towers_validator.js'
import InterfaceStatusComponent, {InterfaceHandlers} from '../components/interface_status.js'
import { currentStatus } from '../data/status.js'
import { randomOfSize } from '../puzzles/towers/towers_loader.js'
import Process from '../data/process.js'
import RandomSelectionProcess from '../data/processes/random_selection_process.js'
import SimpleViewProcess from '../data/processes/simple_view_process.js'
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
  autoRandom: boolean,
  systematicSolve: boolean,
  systematicSolveAttempt: number,
  systematicSolveCounter: number,
  isDone: boolean,
  isCorrect: boolean,
  randomProcess: RandomSelectionProcess|null,
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
      autoRandom: false,
      systematicSolve: false,
      systematicSolveAttemp: 0,
      systematicSolveCounter: 0,
      isDone: false,
      isCorrect: false,
      randomProcess: null,
      validationProcess: null,
      activeProcesses: new Set(),
    });

    function size(): number {
      return currentStatus.interfacesCurrentSize[props.interfaceId];
    }

    function restart(): void {
      data.activeProcesses.forEach(p => currentStatus.cpu.killProcess(p));
      data.activeProcesses.clear();
      data.randomProcess = null;

      data.validating = false;
      data.isCorrect = false;
      data.isDone = false;
      data.currentPuzzle.restart();
      puzzleUUID += 1;
      if (data.autoView) {
        for (const face of [HintFace.NORTH, HintFace.EAST, HintFace.SOUTH, HintFace.WEST]) {
          for (let i = 0; i < data.currentPuzzle.n; ++i) {
            const p = new SimpleViewProcess(data.currentPuzzle, face, i, props.interfaceId);
            if (currentStatus.cpu.addProcess(p, 9, () => { data.activeProcesses.delete(p) })) {
              data.activeProcesses.add(p);
            }
          }
        }
      } else if (data.autoRandom) {
        startRandomProcess();
      }
    }

    function startValidate(): void {
      data.activeProcesses.forEach(p => currentStatus.cpu.killProcess(p));
      data.activeProcesses.clear();
      data.randomProcess = null;

      data.validating = true;
      data.isDone = false;
      data.isCorrect = false;
      data.validationProcess = new ValidationProcess(data.currentPuzzle, props.interfaceId);
      data.activeProcesses.add(data.validationProcess);
      currentStatus.cpu.addProcess(data.validationProcess, 10, (isValid: boolean) => {
        data.isDone = true;
        data.isCorrect = isValid;
        data.activeProcesses.delete(data.validationProcess!);
        data.validationProcess = null;
        if (data.isCorrect && data.autoCashIn) {
          cashIn();
        } else if (!data.isCorrect && data.autoRestart) {
          restart();
        }
      });
    }

    async function cashIn() {
      currentStatus.puzzleCompleted(size());
      await assignNewPuzzle()
    }

    async function assignNewPuzzle() {
      data.validating = false;
      data.isCorrect = false;
      data.isDone = false;

      data.activeProcesses.forEach(p => currentStatus.cpu.killProcess(p));
      data.activeProcesses.clear();
      data.randomProcess = null;

      data.currentPuzzle = await randomOfSize(size());
      data.currentPuzzle.onAction((a: Action) => {
        if (data.currentPuzzle.hasContradiction) {
          data.activeProcesses.forEach(p => currentStatus.cpu.killProcess(p));
          data.activeProcesses.clear();
          data.randomProcess = null;
          if (data.systematicSolve) {
            data.systematicSolveAttemp += 1;
            data.currentPuzzle.restoreLatestSnapshot();
            const p = new SystematicProcess(data.currentPuzzle, a.row, i, v, props.interfaceId);
            if (currentStatus.cpu.addProcess(p, 9, () => { data.activeProcesses.delete(p); })) {
              data.activeProcesses.add(p);
            }
          }
          return;
        }
        if (data.autoUnique && a.type == ActionType.REMOVE_POSSIBILITY) {
          const cell = data.currentPuzzle.marksCell(a.row, a.column);
          if (cell.size == 1) {
            const v: number = cell.values().next().value;
            for (let i = 0; i < data.currentPuzzle.n; ++i) {
              if (i != a.column) {
                const p = new RemovalProcess(data.currentPuzzle, a.row, i, v, props.interfaceId);
                if (currentStatus.cpu.addProcess(p, 9, () => { data.activeProcesses.delete(p); })) {
                  data.activeProcesses.add(p);
                }
              }
              if (i != a.row) {
                const p = new RemovalProcess(data.currentPuzzle, i, a.column, v, props.interfaceId);
                if (currentStatus.cpu.addProcess(p, 9, () => { data.activeProcesses.delete(p); })) {
                  data.activeProcesses.add(p);
                }
              }
            }
          }
        }
        if (data.currentPuzzle.isReadyForValidation && data.autoValidate && !data.validating) {
          startValidate();
        }
      });

      puzzleUUID += 1;
      if (data.autoView) {
        for (const face of [HintFace.NORTH, HintFace.EAST, HintFace.SOUTH, HintFace.WEST]) {
          for (let i = 0; i < data.currentPuzzle.n; ++i) {
            const p = new SimpleViewProcess(data.currentPuzzle, face, i, props.interfaceId);
            if (currentStatus.cpu.addProcess(p, 9, () => { data.activeProcesses.delete(p) })) {
              data.activeProcesses.add(p);
            }
          }
        }
      } else if (data.autoRandom) {
        startRandomProcess();
      }
    }

    function startRandomProcess() {
      if (data.randomProcess !== null) {
        currentStatus.cpu.killProcess(data.randomProcess);
      }
      data.randomProcess = new RandomSelectionProcess(data.currentPuzzle, props.interfaceId);
      data.activeProcesses.add(data.randomProcess);
      currentStatus.cpu.addProcess(data.randomProcess, props.interfaceId, () => {
        data.activeProcesses.delete(data.randomProcess!)
        data.randomProcess = null;
      })
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
        isValidating: data.validating,
        isDone: data.isDone,
        isCorrect: data.isCorrect,
        puzzle: data.currentPuzzle,
      }
      interfaceProps[InterfaceHandlers.UPGRADE] = async () => {
        currentStatus.upgradeInterface(props.interfaceId);
        await assignNewPuzzle();
      }
      interfaceProps[InterfaceHandlers.RESTART] = restart
      interfaceProps[InterfaceHandlers.START_VALIDATE] = startValidate
      interfaceProps[InterfaceHandlers.STOP_VALIDATE] = async () => {
        data.validating = false;
        if (data.validationProcess) {
          data.activeProcesses.delete(data.validationProcess);
          currentStatus.cpu.killProcess(data.validationProcess);
        }
        if (data.isCorrect) {
          await cashIn();
        }
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
        label: 'Auto Restart',
        boxId: 'auto_restart_checkbox',
        onChange: (e: Event) => {
          const t: HTMLInputElement = e.target as HTMLInputElement;
          data.autoRestart = t.checked;
        }
      });
      items.push(autoRestart);

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

      const autoRandom = Vue.h(LabeledCheckbox, {
        value: data.autoRandom,
        label: 'Auto Random Selection',
        boxId: 'auto_randomselection_checkbox',
        onChange: (e: Event) => {
          const t: HTMLInputElement = e.target as HTMLInputElement;
          data.autoRandom = t.checked;
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
