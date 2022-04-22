import Vue from '../../vue.js'
import { toSimonTathamId } from '../../puzzles/towers/util.js'
import Towers from '../../puzzles/towers/towers.js'

import TowersOptionsComponent from './towers_options.js'
import TowersComponent from './towers.js'
import TowersValidatorComponent from './towers_validator.js'
import InterfaceStatusComponent, {InterfaceHandlers} from '../interface_status.js'

import { currentStatus } from '../../data/status.js'
import TowersOptions, { currentOptions } from '../../data/towers/towers_options.js'
import {puzzles, processLaunchers, validations, onPuzzleChange, assignNewPuzzle, stopAllProcesses, startValidate, stopValidate } from '../../data/towers/towers_puzzles.js'
import {towersUpgrades} from '../../data/towers/towers_upgrades.js'

interface InterfaceComponentProps {
  interfaceId: number,
}

interface InterfaceComponentData {
  // Used to detect that the puzzle has changed
  puzzleUUID: number,
}

export default {
  props: ['interfaceId'],
  setup(props: InterfaceComponentProps) {
    while (currentOptions.length <= props.interfaceId) {
      currentOptions.push(Vue.reactive(new TowersOptions()));
    }
    const options: TowersOptions = currentOptions[props.interfaceId];
    while (puzzles.length <= props.interfaceId) {
      assignNewPuzzle(puzzles.length);
    }
    let currentPuzzle = puzzles[props.interfaceId];
    let processLauncher = processLaunchers[props.interfaceId];

    const data: InterfaceComponentData = Vue.reactive({
      puzzleUUID: 0,
    });

    function restart(): void {
      if (currentStatus.allTimeMoney == 0) {
        currentStatus.latestValidationResult = 0;
      }
      stopAllProcesses(props.interfaceId);
      currentPuzzle.restart();
      processLauncher.startInitialProcessesIfNeeded();
    }

    onPuzzleChange(props.interfaceId, () => {
      currentPuzzle = puzzles[props.interfaceId];
      processLauncher = processLaunchers[props.interfaceId];
      data.puzzleUUID += 1;
    });

    Vue.onMounted(() => {
      currentPuzzle = puzzles[props.interfaceId];
      if (currentPuzzle.n == 0) {
        assignNewPuzzle(props.interfaceId);
      }
    });

    return () => {
      let items = [];

      const optionsComponent = Vue.h(TowersOptionsComponent, {
        interfaceId: props.interfaceId,
        options: options,
        onRandomGuessOn: () => { processLauncher.startRandomGuessProcessIfNeeded(); },
        onSizeChange: () => { assignNewPuzzle(props.interfaceId); },
      });
      items.push(optionsComponent);

      const interfaceProps: any = {
        undoUnlocked: towersUpgrades.undo.isUnlocked,
        guessUnlocked: towersUpgrades.guess.isUnlocked,
        interfaceId: props.interfaceId,
        guesses: currentPuzzle.guesses,
        isValidating: !!validations[props.interfaceId],
        isDone: validations[props.interfaceId] && validations[props.interfaceId]!.isDone,
        isCorrect: validations[props.interfaceId] && validations[props.interfaceId]!.returnValue,
        size: options.currentSize,
        puzzle: currentPuzzle,
      }
      interfaceProps[InterfaceHandlers.RESTART] = restart;
      interfaceProps[InterfaceHandlers.START_VALIDATE] = () => {
        startValidate(props.interfaceId)
      };
      interfaceProps[InterfaceHandlers.STOP_VALIDATE] = () => {
        stopValidate(props.interfaceId);
      };
      interfaceProps[InterfaceHandlers.UNDO] = () => {
        stopAllProcesses(props.interfaceId);
        currentPuzzle.undo();
      };
      interfaceProps[InterfaceHandlers.ABANDON_GUESS] = () => {
        stopAllProcesses(props.interfaceId);
        currentPuzzle.abandonGuess();
      };
      interfaceProps[InterfaceHandlers.MARK_GUESS_AS_IMPOSSIBLE] = () => {
        stopAllProcesses(props.interfaceId);
        currentPuzzle.markGuessAsImpossible();
      };
      const interfaceStatus = Vue.h(InterfaceStatusComponent, interfaceProps)
      items.push(interfaceStatus);

      const towersProps: any = {
        key: 'puzzle-' + data.puzzleUUID,
        puzzle: currentPuzzle,
        validationProcess: validations[props.interfaceId],
      }

      const flexItems: any = [];
      const towersComponent = Vue.h(TowersComponent, towersProps);
      flexItems.push(towersComponent);

      if (validations[props.interfaceId] && options.showValidation) {
        const validator = Vue.h(TowersValidatorComponent, {
          process: validations[props.interfaceId],
        });
        flexItems.push(validator);
      }
      items.push(Vue.h('div', {
        style: {
          display: 'flex',
          'flex-wrap': 'wrap',
          'justify-content': 'space-around',
        }
      }, flexItems));

      if (currentPuzzle instanceof Towers && options.showPuzzleId) {
        items.push(Vue.h('span', {}, 'Puzzle ID: ' + toSimonTathamId(currentPuzzle)));
        items.push(Vue.h('br'));
        items.push(Vue.h('em', {}, '(compatible with Simon Tatham\'s implementation)'));
        items.push(Vue.h('br'));
        items.push(Vue.h('input', {id: 'puzzle-id-input'}, ''));
        items.push(Vue.h('button', {onclick: () => {
          const element = document.getElementById('puzzle-id-input') as HTMLInputElement;
          const id = element.value;
          assignNewPuzzle(props.interfaceId, id);
        }}, 'Import With ID'));
      }

      const info = [
        Vue.h('strong', {style: {display: 'inline-block'}}, `Towers ${props.interfaceId + 1}`),
      ];
      info.push(' | ');
      const red = '#b0000030';
      const yellow = '#b0b00030';
      const green = '#00b00030';
      const styleWithColor = (c: string) => {
        return {
          display: 'inline-block',
          'border-radius': '4px',
          'padding-left': '6px',
          'padding-right': '6px',
          'background-color': c,
        }
      }
      const v = validations[props.interfaceId];
      if (v) {
        if (!v.isDone) {
          info.push(Vue.h('span', {
            style: styleWithColor(green),
          }, `Validating...`));
        } else if (v.returnValue) {
          info.push(Vue.h('span', {
            style: styleWithColor(yellow),
          }, `Ready To Cash In`));
        } else {
          info.push(Vue.h('span', {
            style: styleWithColor(red),
          }, `Validation Failed`));
        }
      } else if (currentPuzzle.hasContradiction) {
        info.push(Vue.h('span', {
          style: styleWithColor(red),
        }, `Contradiction Found`));
      } else if (currentPuzzle.isReadyForValidation()) {
        info.push(Vue.h('span', {
          style: styleWithColor(yellow),
        }, `Ready For Validation`));
      } else if (processLaunchers[props.interfaceId].hasRandomGuess.value) {
        info.push(Vue.h('span', {
          style: styleWithColor(green),
        }, `Auto-Guessing...`));
      } else if (processLaunchers[props.interfaceId].processCount.value > 0) {
        info.push(Vue.h('span', {
          style: styleWithColor(green),
        }, `Auto-Solving...`));
      } else {
        info.push(Vue.h('span', {
          style: styleWithColor(yellow),
        }, `Manual Solve`));
      }

      return Vue.h('details', {open: true, class: 'towers-interface'}, [
        Vue.h('summary', {}, info),
        Vue.h('div', {}, items),
      ]);
    };
  }
}
