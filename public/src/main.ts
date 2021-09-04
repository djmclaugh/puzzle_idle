import Vue from './vue.js'
import Towers from './puzzles/towers/towers.js'
import TowersRowChecker from './puzzles/bots/towers_row_checker.js'
import TowersColumnChecker from './puzzles/bots/towers_column_checker.js'
import Bot from './puzzles/bots/bot.js'
import ViewBoundsBot from './puzzles/bots/view_bounds_bot.js'
import TowersComponent from './components/towers.js'
import TowersValidatorComponent from './components/towers_validator.js'
import { randomOfSize } from './puzzles/towers/towers_loader.js'

interface AppData {
  money: number,
  ram: number,
  currentPuzzle: Towers,
  validating: boolean,
  validationSpeed: number,
  botSpeed: number,
  isDone: boolean,
  isCorrect: boolean,
  botLogs: string[],
}

let puzzleUUID = 0;
randomOfSize(3);

const App = {
  setup(): any {
    const data: AppData = Vue.reactive({
      money: 0,
      ram: 4,
      currentPuzzle: {},
      validating: false,
      validationSpeed: 100,
      botSpeed: 10,
      isDone: false,
      isCorrect: false,
      botLogs: [],
    });

    let bot1: Bot;
    let bot2: Bot;
    let bot3: Bot;

    Vue.onMounted(async () => {
      data.currentPuzzle = await randomOfSize(7);
      bot1 = new TowersRowChecker(data.currentPuzzle);
      bot2 = new TowersColumnChecker(data.currentPuzzle);
      bot3 = new ViewBoundsBot(data.currentPuzzle);
      data.botLogs = bot3.logs = Vue.reactive(bot3.logs);
    })


    function loop() {
      setTimeout(async () => {
        if (!data.validating) {
          // console.log(data.currentPuzzle.marksToString());
          // TowersSolver.simpleViewSolve(data.currentPuzzle);
          // console.log(data.currentPuzzle.marksToString());
          // TowersSolver.simpleLatinSolve(data.currentPuzzle, [0,1,2,3], [0,1,2,3]);
          // console.log(data.currentPuzzle.marksToString());
          // console.log("thinking...")
          // const time = Date.now();
          // TowersSolver.depthSolve(data.currentPuzzle, 1);
          // console.log((Date.now() - time) / 1000 + " seconds")

          bot1.tick();
          bot2.tick();
          bot3.tick();
        }
        loop();
      }, 1000 / data.botSpeed);
    }
    loop();

    return () => {
      let items = [];
      items.push(Vue.h('p', {}, `Current money: $${data.money}`));
      items.push(Vue.h('p', {}, `RAM: ${data.ram} KB`));

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

      const restartButton = Vue.h('button', {
        onClick: () => {
          data.currentPuzzle.restart();
          puzzleUUID += 1;
          bot1 = new TowersRowChecker(data.currentPuzzle);
          bot2 = new TowersColumnChecker(data.currentPuzzle);
          bot3 = new ViewBoundsBot(data.currentPuzzle);
          data.botLogs = bot3.logs = Vue.reactive(bot3.logs);
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
        let message = data.isDone ? (data.isCorrect ? 'Cash in $$$' : 'Return to edit mode') : 'Cancel';
        const stopButton = Vue.h('button', {
          onClick: async () => {
            data.validating = false;
            if (data.isCorrect) {
              data.money += 5;
              data.currentPuzzle = await randomOfSize(7),
              bot1 = new TowersRowChecker(data.currentPuzzle);
              bot2 = new TowersColumnChecker(data.currentPuzzle);
              bot3 = new ViewBoundsBot(data.currentPuzzle);
              data.botLogs = bot3.logs = Vue.reactive(bot3.logs);
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
      } else {
        const logs = data.botLogs.map(log => {
          return Vue.h('p', {}, log);
        });
        items = items.concat(logs);
      }

      return Vue.h('div', {}, items);
    }
  }
};

Vue.createApp(App).mount('app');
