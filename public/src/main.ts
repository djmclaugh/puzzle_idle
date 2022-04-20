import Vue from './vue.js'

import {makeCollapsableFieldset} from './components/util/collapsable_fieldset.js'

import CPUStatus from './components/cpu_status.js'
import PowerStatus from './components/power_status.js'
import Status from './components/status.js'
import PuzzlesSection from './components/puzzles_section.js'
import TowersUpgrades from './components/towers/towers_upgrades.js'

import { currentTicker } from './data/ticker.js'
import { toSaveState, fromSaveState, saveToCookie, loadFromCookie, START } from './data/save.js'

import { loadAllTowers, randomOfSize } from './puzzles/towers/towers_loader.js'

interface AppData {
  puzzlesLoaded: boolean,
  showSave: boolean,
  upToDate: boolean,
  saveState: string,
  loadState: string,
  message: string,
  puzzleChoice: string,
  currentInterface: number,
}

const App = {
  setup(): any {
    const data: AppData = Vue.reactive({
      puzzlesLoaded: false,
      showSave: false,
      upToDate: false,
      saveState: "",
      loadState: "",
      message: "",
      puzzleChoice: "towers",
      currentInterface: 0,
    });

    Vue.onMounted(() => {
      loadAllTowers().then(() => {
        data.puzzlesLoaded = true;
        Vue.nextTick(() => {
          loadFromCookie();
          data.saveState = toSaveState();
          setInterval(() => {
            saveToCookie();
            data.saveState = toSaveState();
          }, 1000 * 60);
          Vue.nextTick(() => {
            currentTicker.startTicking();
            data.upToDate = true;
          });
        });
      });
    });

    return () => {
      if (!data.puzzlesLoaded) {
        return "Loading Puzzles..."
      }
      if (!data.saveState) {
        return "Processing Save Cookie..."
      }
      if (!data.upToDate) {
        return "Processing Offline Progress..."
      }
      let saveSection = makeCollapsableFieldset({label: "Save Options", id: "save_section"}, () => [
        "Game auto-saves every minute.",
        Vue.h('br'),
        "Note: In progress puzzles and routines NOT saved. Only money, upgrades, and settings are saved.",
        Vue.h('br'),
        Vue.h('button', {
          onClick: () => {
            data.saveState = toSaveState();
            saveToCookie();
          },
        }, "Update Save Now"),
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
        Vue.h('button', {onClick: () => {data.message = `Load the following state to restart from the very begining: ${START}`}}, "Clear ALL Progress"),
        Vue.h('br'),
        data.message,
      ]);
      let right = [];
      right.push(Vue.h(Status));
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
        saveSection,
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
