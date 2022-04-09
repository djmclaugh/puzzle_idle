import Vue from './vue.js'
import LabeledCheckbox from './components/util/labeled_checkbox.js'
import CPUStatus from './components/cpu_status.js'
import PowerStatus from './components/power_status.js'
import Status from './components/status.js'
import PuzzlesSection from './components/puzzles_section.js'
import TowersUpgrades from './components/towers/towers_upgrades.js'
import { toSaveState, fromSaveState, saveToCookie, loadFromCookie } from './data/save.js'

toSaveState();

interface AppData {
  showSave: boolean,
  saveState: string,
  loadState: string,
  message: string,
  puzzleChoice: string,
  currentInterface: number,
}

const App = {
  setup(): any {
    const data: AppData = Vue.reactive({
      showSave: false,
      saveState: "",
      loadState: "",
      message: "",
      puzzleChoice: "towers",
      currentInterface: 0,
    });

    Vue.onMounted(() => {
      loadFromCookie();
      setInterval(() => {
        saveToCookie();
      }, 1000 * 60);
    });

    return () => {
      let saveSection = Vue.h('div', {hidden: !data.showSave}, [
        "Game auto-saves every minute.",
        Vue.h('br'),
        "Note: Puzzle and process states not saved. Only money, upgrades, and settings are saved.",
        Vue.h('br'),
        Vue.h('button', {
          onClick: () => {
            data.saveState = toSaveState();
            saveToCookie();
          },
        }, "Save"),
        " : ",
        data.saveState,
        Vue.h('br'),
        Vue.h('button', {
          onClick: () => {
            const prev = toSaveState();
            fromSaveState(data.loadState);
            data.message = `Save state ${prev} overwritten by save state ${data.loadState}`;
            saveToCookie();
          },
        }, "Load"),
        " : ",
        Vue.h('input', {
          value: data.loadState,
          onInput: (e: InputEvent) => {
            const target = e.target as HTMLInputElement;
            data.loadState = target.value;
          },
        }),
        Vue.h('br'),
        Vue.h('button', {onClick: () => {data.message = 'Load the following state to restart from the very begining: ["0.0.1","0,0","0|0,0,0,a,2,a,0","1,1","[2]|0",["2,4"]]'}}, "Clear ALL Progress"),
        Vue.h('br'),
        data.message,
      ])
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
        Vue.h(LabeledCheckbox, {
          label: "Show Save Options",
          value: data.showSave,
          boxId: "show_save_checkbox",
          onChange: (e: InputEvent) => {
            const target = e.target as HTMLInputElement
            data.showSave = target.checked;
          }
        }),
        saveSection,
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
