import Vue from '../vue.js'
import Towers from '../puzzles/towers/towers.js'
import TowersComponent from '../components/towers.js'
import TowersValidatorComponent from '../components/towers_validator.js'
import { currentStatus } from '../data/status.js'
import { randomOfSize } from '../puzzles/towers/towers_loader.js'
import RandomSelectionProcess from '../data/processes/random_selection_process.js'
import ValidationProcess, { ValidationStep } from '../data/processes/validation_process.js'
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
  autoRandom: boolean,
  isDone: boolean,
  isCorrect: boolean,
  randomProcess: RandomSelectionProcess|null,
  validationProcess: ValidationProcess|null,
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
      autoRandom: true,
      isDone: false,
      isCorrect: false,
      randomProcess: null,
      validationProcess: null,
    });

    let currentWatcherStopper: any = null;

    function size(): number {
      return currentStatus.interfacesCurrentSize[props.interfaceId];
    }

    function restart(): void {
      if (data.randomProcess) {
        currentStatus.cpu.killProcess(data.randomProcess);
        data.randomProcess = null;
      }
      data.validating = false;
      data.isCorrect = false;
      data.isDone = false;
      data.currentPuzzle.restart();
      puzzleUUID += 1;
      if (data.autoRandom) {
        startRandomProcess();
      }
    }

    function startValidate(): void {
      data.validating = true;
      data.isDone = false;
      data.isCorrect = false;
      data.validationProcess = new ValidationProcess(data.currentPuzzle, props.interfaceId);
      currentStatus.cpu.addProcess(data.validationProcess, 10, (isValid: boolean) => {
        data.isDone = true;
        data.isCorrect = isValid;
        if (data.isCorrect && data.autoCashIn) {
          cashIn();
        }
        if (!data.isCorrect && data.autoRestart) {
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
      data.currentPuzzle = await randomOfSize(size());
      if (currentWatcherStopper) {
        currentWatcherStopper();
      }
      currentWatcherStopper = Vue.watch(data.currentPuzzle, (puzzle: Towers) => {
        if (puzzle.isReadyForValidation && data.autoValidate && !data.validating) {
          startValidate();
        }
      });
      puzzleUUID += 1;
      if (data.autoRandom) {
        startRandomProcess();
      }
    }

    function startRandomProcess() {
      if (data.randomProcess !== null) {
        currentStatus.cpu.killProcess(data.randomProcess);
      }
      data.randomProcess = new RandomSelectionProcess(data.currentPuzzle, props.interfaceId);
      currentStatus.cpu.addProcess(data.randomProcess, props.interfaceId, () => {
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

      const upgradeButton = Vue.h('button', {
        onClick: async () => {
          currentStatus.upgradeInterface(props.interfaceId);
          await assignNewPuzzle();
        },
        disabled: data.validating || !currentStatus.canAffordInterfaceUpgrade(props.interfaceId)
      }, `Upgrade ($${currentStatus.interfaceUpgradeCost(props.interfaceId)})`);
      items.push(upgradeButton);

      const restartButton = Vue.h('button', {
        onClick: () => {
          restart();
        },
        disabled: data.validating,
      }, 'Restart');
      items.push(restartButton);

      const undoButton = Vue.h('button', {
        onClick: () => {
          data.currentPuzzle.undo();
        },
        disabled: !data.currentPuzzle.history || data.currentPuzzle.history.length == 0,
      }, 'Undo');
      items.push(undoButton);

      const checkButton = Vue.h('button', {
        onClick: startValidate,
        disabled: !(data.currentPuzzle instanceof Towers) || data.validating || !data.currentPuzzle.isReadyForValidation,
      }, 'Validate');
      items.push(checkButton);

      if (data.validating) {
        let message = data.isDone ? (data.isCorrect ? `Cash In (+$${currentStatus.puzzleReward(size())})` : 'Return to edit mode') : 'Cancel';
        const stopButton = Vue.h('button', {
          onClick: async () => {
            data.validating = false;
            if (data.isCorrect) {
              await cashIn();
            }
          },
        }, message);
        items.push(stopButton);
      }

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
      if (data.validating) {
        towersProps.interactive = false;
        towersProps.backgrounds = data.validationProcess!.getBackgrounds();
      }
      const p = Vue.h(TowersComponent, towersProps);
      items.push(p);

      if (data.validating) {
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
