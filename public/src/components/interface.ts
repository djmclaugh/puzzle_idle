import Vue from '../vue.js'
import Towers from '../puzzles/towers/towers.js'
import TowersComponent from '../components/towers.js'
import TowersValidatorComponent from '../components/towers_validator.js'
import { currentStatus } from '../data/status.js'
import { randomOfSize } from '../puzzles/towers/towers_loader.js'
import RandomSelectionProcess from '../data/processes/random_selection_process.js'
import LabeledCheckbox from './util/labeled_checkbox.js'

interface InterfaceComponentProps {
  interfaceId: number,
}

interface InterfaceComponentData {
  currentPuzzle: Towers,
  validating: boolean,
  autoValidate: boolean,
  autoCashIn: boolean,
  autoRestart: boolean,
  isDone: boolean,
  isCorrect: boolean,
}

let puzzleUUID: number = 0;

export default {
  props: ['interfaceId'],
  setup(props: InterfaceComponentProps): any {
    const data: InterfaceComponentData = Vue.reactive({
      currentPuzzle: {},
      validating: false,
      autoValidate: true,
      autoCashIn: true,
      autoRestart: true,
      isDone: false,
      isCorrect: false,
    });

    let currentWatcherStopper: any = null;

    function size(): number {
      return currentStatus.interfacesCurrentSize[props.interfaceId];
    }

    function startValidate(): void {
      data.validating = true;
      data.isDone = false;
      data.isCorrect = false;
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
    }

    Vue.onMounted(async () => {
      await assignNewPuzzle();
    })

    return () => {
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
          data.currentPuzzle.restart();
          puzzleUUID += 1;
        },
        disabled: data.validating,
      }, 'Restart');
      items.push(restartButton);

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

      const towersProps: any = {
        key: 'puzzle-' + puzzleUUID,
        puzzle: data.currentPuzzle,
        interactive: true,
      }
      if (data.validating) {
        towersProps.hidden = true;
        towersProps.style = {
          display: 'none',
        }
      }
      const p = Vue.h(TowersComponent, towersProps);
      items.push(p);

      if (data.validating) {
        const validator = Vue.h(TowersValidatorComponent, {
          puzzle: data.currentPuzzle,
          interfaceId: props.interfaceId,
          onDone: (isCorrect: boolean) => {
            data.isDone = true;
            data.isCorrect = isCorrect;
            if (data.isCorrect && data.autoCashIn) {
              cashIn();
            }
            if (!data.isCorrect && data.autoRestart) {
              data.validating = false;
              data.isCorrect = false;
              data.isDone = false;
              data.currentPuzzle.restart();
              puzzleUUID += 1;
            }
          }
        })
        items.push(validator);
      } else {
        // Nothing for now
      }

      return Vue.h('div', {}, items);
    }
  }
};
