import Vue from './vue.js'
import CPUStatus from './components/cpu_status.js'
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
      let items = [];
      items.push(Vue.h(Status));
      items.push(Vue.h(CPUStatus));
      if (data.puzzleChoice == "towers") {
        items.push(Vue.h(TowersUpgrades));
      }
      // items.push(Vue.h('h3', {}, 'Interfaces: '));
      // for (let i = 0; i < currentStatus.interfaces.length; ++i) {
      //   items.push(Vue.h('div', {
      //     class: {
      //       'interface-selector': true,
      //       'interface-selector-selected': i == data.currentInterface,
      //     },
      //     onClick: () => {
      //       data.currentInterface = i;
      //     }
      //   }, "" + (i + 1)));
      // }
      //
      // items.push(Vue.h('br'));
      // items.push(Vue.h('br'));

      if (data.puzzleChoice == "") {
        items.push(Vue.h("select", {
          onChange: (e: InputEvent) => {
            data.puzzleChoice = (e.target! as HTMLOptionElement).value;
          }
        }, [
          Vue.h("option", {value: ""}, "Choose a puzzle type"),
          Vue.h("option", {value: "loopy"}, "Loopy / Slitherlink"),
          Vue.h("option", {value: "towers"}, "Towers / Skyscrapers"),
        ]));
      } else {
        items.push(Vue.h(PuzzlesSection, {puzzleType: data.puzzleChoice}));
      }

      return Vue.h('div', {}, items);
    }
  }
};

Vue.createApp(App).mount('app');
