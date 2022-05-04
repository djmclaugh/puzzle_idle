import Vue from './vue.js'

import {makeCollapsableFieldset} from './components/util/collapsable_fieldset.js'

import CPUStatus from './components/cpu_status.js'
import PowerStatus from './components/power_status.js'
import Status from './components/status.js'
import PuzzlesSection from './components/puzzles_section.js'
import TowersUpgrades from './components/towers/towers_upgrades.js'
import { secondsToString } from './components/util/units.js'

import { currentTicker } from './data/ticker.js'
import { toSaveState, fromSaveState, saveToLocalStorage, loadFromLocalStorage, START } from './data/save.js'

import { loadAllTowers } from './puzzles/towers/towers_loader.js'

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
      setTimeout(() => {
        loadAllTowers().then(() => {
          data.puzzlesLoaded = true;
          setTimeout(() => {
            loadFromLocalStorage();
            data.saveState = toSaveState();
            setInterval(() => {
              saveToLocalStorage();
              data.saveState = toSaveState();
            }, 1000 * 60);
            if (currentTicker.lastTick == 0) {
              currentTicker.startTicking();
              data.upToDate = true;
            } else {
              setTimeout(() => {
                const checkIfCaughtUp = () => {
                  if (Date.now() - currentTicker.lastTick < 500) {
                    data.upToDate = true;
                    currentTicker.removeListener(checkIfCaughtUp);
                  }
                };
                currentTicker.onTick(checkIfCaughtUp);
                currentTicker.startTicking();
              }, 500);
            }
          }, 500);
        });
      }, 500);
    });

    return () => {
      if (!data.puzzlesLoaded) {
        return "Loading Puzzles..."
      }
      if (!data.saveState) {
        return "Fetching Save State From Local Storage..."
      }
      if (!data.upToDate) {
        return Vue.h('span', {}, [
          `Processing ${secondsToString((Date.now() - currentTicker.lastTick)/1000)} of offline progress... `,
          Vue.h('br'),
          `Processing at a rate of 1000 seconds per second. Estimated time remaining: ${secondsToString((Date.now() - currentTicker.lastTick)/1000000)}`,
          Vue.h('br'),
          Vue.h('button', {
            onClick: () => {currentTicker.lastTick = Date.now();},
          }, "Skip (forfeit remaining offline progress)"),
        ]);
      }
      let saveSection = makeCollapsableFieldset({label: "Save Options", id: "save_section", collapsed: true}, () => [
        "Game auto-saves every minute.",
        Vue.h('br'),
        "Note: In progress puzzles and routines NOT saved. Only money, upgrades, and settings are saved.",
        Vue.h('br'),
        Vue.h('button', {
          onClick: () => {
            data.saveState = toSaveState();
            saveToLocalStorage();
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
            saveToLocalStorage();
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
        makeCollapsableFieldset({
          label: "About",
          id: "about_fieldset",
          collapsed: true,
        }, () => {
          return [
            Vue.h('span', ['Made using Vue.js: ', Vue.h('a', {
              target: "_blank",
              href: 'https://vuejs.org/',
            }, 'https://vuejs.org/')]),
            Vue.h('br'),
            Vue.h('span', ['Source: ', Vue.h('a', {
              target: "_blank",
              href: 'https://github.com/djmclaugh/puzzle_idle',
            }, 'https://github.com/djmclaugh/puzzle_idle')]),
            Vue.h('br'),
            Vue.h('span', ['Feedback/Bug Report: ', Vue.h('a', {
              target: "_blank",
              href: 'https://github.com/djmclaugh/puzzle_idle/issues',
            }, 'https://github.com/djmclaugh/puzzle_idle/issues')]),
          ];
        }),
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
