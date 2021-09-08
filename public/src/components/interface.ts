import Vue from '../vue.js'
import Towers from '../puzzles/towers/towers.js'
import TowersComponent from '../components/towers.js'
import TowersValidatorComponent from '../components/towers_validator.js'
import { currentStatus } from '../data/status.js'
import { randomOfSize } from '../puzzles/towers/towers_loader.js'

interface InterfaceComponentProps {
  interfaceId: number,
}

interface InterfaceComponentData {
  currentPuzzle: Towers,
  validating: boolean,
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
      isDone: false,
      isCorrect: false,
    });

    function size(): number {
      return currentStatus.interfacesCurrentSize[props.interfaceId];
    }

    Vue.onMounted(async () => {
      data.currentPuzzle = await randomOfSize(size());
    })

    return () => {
      let items = [];

      const upgradeButton = Vue.h('button', {
        onClick: async () => {
          currentStatus.upgradeInterface(props.interfaceId);
          data.currentPuzzle = await randomOfSize(size()),
          puzzleUUID += 1;
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
        onClick: () => {
          data.validating = true;
          data.isDone = false;
          data.isCorrect = false;
        },
        disabled: !(data.currentPuzzle instanceof Towers) || data.validating || !data.currentPuzzle.isReadyForValidation(),
      }, 'Validate');
      items.push(checkButton);

      if (data.validating) {
        let message = data.isDone ? (data.isCorrect ? `Cash in (+$${currentStatus.puzzleReward(size())})` : 'Return to edit mode') : 'Cancel';
        const stopButton = Vue.h('button', {
          onClick: async () => {
            data.validating = false;
            if (data.isCorrect) {
              currentStatus.puzzleCompleted(size());
              data.currentPuzzle = await randomOfSize(size()),
              puzzleUUID += 1;
            }
          },
        }, message);
        items.push(stopButton);
      }

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
          speed: currentStatus.cpuSpeed,
          onDone: (isCorrect: boolean) => {
            data.isDone = true;
            data.isCorrect = isCorrect;
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
