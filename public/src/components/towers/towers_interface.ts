import Vue from '../../vue.js'
import { toSimonTathamId } from '../../puzzles/towers/util.js'
import Towers from '../../puzzles/towers/towers.js'

import TowersOptionsComponent from './towers_options.js'
import TowersComponent from './towers.js'
import TowersValidatorComponent from './towers_validator.js'
import InterfaceStatusComponent, {InterfaceHandlers} from '../interface_status.js'

import { currentStatus } from '../../data/status.js'
import TowersOptions, { currentOptions } from '../../data/towers/towers_options.js'
import {puzzles, processLaunchers, validations, onPuzzleChange, assignNewPuzzle, stopAllProcesses, cashIn, startValidate, stopValidate } from '../../data/towers/towers_puzzles.js'
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

    const incomeTracker: [number, number][] = [];
    const averages: {minute: number, tenMinute: number, hour: number} = Vue.reactive({
      minute: 0,
      tenMinute: 0,
      hour: 0,
    });

    let updateAverageTimeoutId = setTimeout(updateAverages, 2000);
    function updateAverages() {
      // If this was explictly called, cancel the timeout
      clearTimeout(updateAverageTimeoutId)
      const now = Date.now();
      const minuteAgo = now - (60 * 1000)
      const tenMinutesAgo = now - (10 * 60 * 1000)
      const hourAgo = now - (60 * 60 * 1000)

      let minuteSum = 0;
      let tenMinutesSum = 0;
      let hourSum = 0;

      let firstRelevantIndex = -1;
      for (let i = 0; i < incomeTracker.length; ++i) {
        if (firstRelevantIndex == -1 && incomeTracker[i][0] > hourAgo) {
          firstRelevantIndex = i;
        }
        if (firstRelevantIndex != -1) {
          hourSum += incomeTracker[i][1];
          if (incomeTracker[i][0] > tenMinutesAgo) {
            tenMinutesSum += incomeTracker[i][1];
            if (incomeTracker[i][0] > minuteAgo) {
              minuteSum += incomeTracker[i][1];
            }
          }
        }
      }

      if (firstRelevantIndex == -1) {
        incomeTracker.splice(0, incomeTracker.length);
      }
      incomeTracker.splice(0, firstRelevantIndex);

      averages.minute = minuteSum;
      averages.tenMinute = tenMinutesSum / 10;
      averages.hour = hourSum / 60;

      // Update in 2 seconds
      updateAverageTimeoutId = setTimeout(updateAverages, 2000);
    }

    function restart(): void {
      if (currentStatus.allTimeMoney == 0) {
        currentStatus.latestValidationResult = 0;
      }
      stopAllProcesses(props.interfaceId);
      currentPuzzle.restart();
      processLauncher.startInitialProcessesIfNeeded();
    }

    function manualCashIn() {
      incomeTracker.push([Date.now(), currentStatus.puzzleReward(options.currentSize)]);
      updateAverages();
      cashIn(props.interfaceId);
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

      return Vue.h('details', {open: true, class: 'towers-interface'}, [
        Vue.h('summary', {}, [
          Vue.h('strong', {style: {display: 'inline-block'}}, `Towers ${props.interfaceId + 1}`),
          // ' | ',
          // Vue.h('span', {style: {display: 'inline-block'}}, `Last minute: $${averages.minute}`),
          // ' | ',
          // Vue.h('span', {style: {display: 'inline-block'}}, `Last 10 minutes average: $${averages.tenMinute.toFixed(2)}/min`),
          ' | ',
          Vue.h('span', {style: {display: 'inline-block'}}, `Last hour average: $${averages.hour.toFixed(2)}/min`),
        ]),
        Vue.h('div', {}, items),
      ]);
    };
  }
}
