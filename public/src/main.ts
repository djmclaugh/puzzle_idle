import Vue from './vue.js'
import CPUStatus from './components/cpu_status.js'
import PowerStatus from './components/power_status.js'
import Status from './components/status.js'
import PuzzlesSection from './components/puzzles_section.js'
import TowersUpgrades from './components/towers/towers_upgrades.js'
import { currentStatus } from './data/status.js'

interface AppData {
  puzzleChoice: string,
  currentInterface: number,
}

const App = {
  setup(): any {
    const data: AppData = Vue.reactive({
      puzzleChoice: "towers",
      currentInterface: 0,
    });

    return () => {
      let right = [];
      right.push(Vue.h(PowerStatus));
      right.push(Vue.h(CPUStatus));
      if (data.puzzleChoice == "towers") {
        right.push(Vue.h(TowersUpgrades));
      }
      let rightPane = Vue.h('div', {
        style: {
            'width': '49.5%',
        }
      }, right);

      let puzzleSection;
      if (data.puzzleChoice == "") {
        puzzleSection = Vue.h("select", {
          onChange: (e: InputEvent) => {
            data.puzzleChoice = (e.target! as HTMLOptionElement).value;
          }
        }, [
          Vue.h("option", {value: ""}, "Choose a puzzle type"),
          Vue.h("option", {value: "loopy"}, "Loopy / Slitherlink"),
          Vue.h("option", {value: "towers"}, "Towers / Skyscrapers"),
        ]);
      } else {
        puzzleSection = Vue.h(PuzzlesSection, {
          puzzleType: data.puzzleChoice,
          style: {
              'width': '49.5%',
          }
        });
      }

      return Vue.h('div', {}, [
        Vue.h(Status),
        Vue.h('div', {
          style: {
            display: 'flex',
            'justify-content': 'space-between',
          },
        }, [puzzleSection, rightPane]),
      ]);
    }
  }
};

Vue.createApp(App).mount('app');
