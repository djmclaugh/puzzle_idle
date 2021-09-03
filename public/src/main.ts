import Vue from './vue.js'
import Towers from './puzzles/towers/towers.js'
import TowersComponent from './components/towers.js'
import TowersValidatorComponent from './components/towers_validator.js'
import { randomOfSize } from './puzzles/towers/towers_loader.js'

interface AppData {
  money: number,
  currentPuzzle: Towers,
  validating: boolean,
  validationSpeed: number,
  isDone: boolean,
  isCorrect: boolean,
}

let puzzleUUID = 0;
randomOfSize(3);

const App = {
  setup(): any {
    const data: AppData = Vue.reactive({
      money: 0,
      currentPuzzle: {},
      validating: false,
      validationSpeed: 10,
      isDone: false,
      isCorrect: false,
    });

    Vue.onMounted(async () => {
      data.currentPuzzle = await randomOfSize(4);
    })

    return () => {
      const items = [];
      items.push(Vue.h('p', {}, `Current money: $${data.money}`));

      items.push(Vue.h('p', {}, [
        `Validation Speed: ${data.validationSpeed} steps per second. `,
        Vue.h('button', {
          onClick: () => {
            data.money -= data.validationSpeed
            data.validationSpeed += 1;
          },
          disabled: data.money < data.validationSpeed,
        }, `Upgrade ($${data.validationSpeed})`)
      ]));

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
        let message = data.isDone ? (data.isCorrect ? 'Cash in $$$' : 'Return to edit mode') : 'Cancel';
        const stopButton = Vue.h('button', {
          onClick: async () => {
            data.validating = false;
            if (data.isCorrect) {
              data.money += 5;
              data.currentPuzzle = await randomOfSize(4),
              puzzleUUID += 1;
            }
          },
        }, message);
        items.push(stopButton);
      }

      const props: any = {
        key: 'puzzle-' + puzzleUUID,
        puzzle: data.currentPuzzle,
        interactive: true,
      }
      if (data.validating) {
        props.hidden = true;
        props.style = {
          display: 'none',
        }
      }
      const p = Vue.h(TowersComponent, props);
      items.push(p);

      if (data.validating) {
        const validator = Vue.h(TowersValidatorComponent, {
          puzzle: data.currentPuzzle,
          speed: data.validationSpeed,
          onDone: (isCorrect: boolean) => {
            data.isDone = true;
            data.isCorrect = isCorrect;
          }
        })
        items.push(validator);
      }

      return Vue.h('div', {}, items);
    }
  }
};

Vue.createApp(App).mount('app');
