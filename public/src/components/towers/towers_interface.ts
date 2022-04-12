import Vue from '../../vue.js'
import {fromSimonThatamId, toSimonTathamId} from '../../puzzles/towers/util.js'
import Towers, {Action} from '../../puzzles/towers/towers.js'

import TowersOptionsComponent from './towers_options.js'
import TowersComponent from './towers.js'
import TowersValidatorComponent from './towers_validator.js'
import InterfaceStatusComponent, {InterfaceHandlers} from '../interface_status.js'

import { currentStatus } from '../../data/status.js'
import { currentCPU } from '../../data/cpu.js'
import { randomOfSize, loadTowers } from '../../puzzles/towers/towers_loader.js'
import Process from '../../data/process.js'
import RandomGuessProcess from '../../data/processes/towers/random_guess_process.js'
import ValidationProcess from '../../data/processes/towers/validation_process.js'
import TowersOptions, {currentOptions} from '../../data/towers/towers_options.js'
import {currentPuzzles, onPuzzleChange } from '../../data/towers/towers_puzzles.js'
import {towersUpgrades} from '../../data/towers/towers_upgrades.js'
import ProcessLauncher from '../../data/processes/towers/process_launcher.js'

interface InterfaceComponentProps {
  interfaceId: number,
}

interface InterfaceComponentData {
  // Processes that require special handling
  validationProcess: ValidationProcess|null;
  randomGuessProcess: RandomGuessProcess|null;
  otherProcesses: Set<Process<any>>;
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
    while (currentPuzzles.length <= props.interfaceId) {
      currentPuzzles.push(Vue.reactive(new Towers([], [], [], [], [])));
    }
    let currentPuzzle = currentPuzzles[props.interfaceId];
    const data: InterfaceComponentData = Vue.reactive({
      autoView: false,
      autoUniqueImplications: false,
      autoImply: false,
      autoFollowImply: false,
      activeProcesses: new Set(),
      validationProcess: null,
      randomGuessProcess: null,
      otherProcesses: new Set(),
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

    function startProcess(p: Process<any>, priority: number) {
      if (currentCPU.addProcess(p, priority, onProcessOver(p))) {
        data.otherProcesses.add(p);
      }
    }

    function onProcessOver<R>(process: Process<R>) {
      return () => {
        data.otherProcesses.delete(process);
        startRandomGuessProcessIfNeeded();
      }
    }

    const processLauncher = new ProcessLauncher(options, towersUpgrades, props.interfaceId);
    processLauncher.addListener(startProcess);

    function stopAllProcesses() {
      if (data.validationProcess) {
        currentCPU.killProcess(data.validationProcess);
        data.validationProcess = null;
      }
      if (data.randomGuessProcess) {
        currentCPU.killProcess(data.randomGuessProcess);
        data.randomGuessProcess = null;
      }
      for (const p of data.otherProcesses) {
        currentCPU.killProcess(p);
      }
      data.otherProcesses.clear();
    }

    function hasProcessRunning(): boolean {
      return data.validationProcess !== null || data.randomGuessProcess !== null || data.otherProcesses.size > 0;
    }

    function restart(): void {
      if (currentStatus.allTimeMoney == 0) {
        currentStatus.latestValidationResult = 0;
      }
      stopAllProcesses();
      currentPuzzle.restart();
      processLauncher.startInitialProcessesIfNeeded(currentPuzzle);
      startRandomGuessProcessIfNeeded();
    }

    function revert(): void {
      stopAllProcesses();
      if (currentPuzzle.guesses.length == 0) {
        currentPuzzle.restart();
      } else {
        currentPuzzle.markGuessAsImpossible();
      }
      processLauncher.startInitialProcessesIfNeeded(currentPuzzle);
      startRandomGuessProcessIfNeeded();
    }

    function startValidate(): void {
      stopAllProcesses();
      data.validationProcess = new ValidationProcess(currentPuzzle, props.interfaceId);

      currentCPU.addProcess(data.validationProcess, 10, (isValid: boolean) => {
        if (currentStatus.allTimeMoney == 0) {
          currentStatus.latestValidationResult = isValid ? 1 : -1;
        }
        if (isValid && options.autoCashInOn) {
          cashIn();
        } else if (!isValid && options.autoRevertOnContradiction) {
          revert();
        }
      });
    }

    async function stopValidate() {
      if (data.validationProcess) {
        if (data.validationProcess.returnValue) {
          cashIn();
        } else {
          stopAllProcesses();
        }
      }
    }

    function startRandomGuessProcessIfNeeded() {
      if (options.randomGuessOn && !hasProcessRunning() && !currentPuzzle.isReadyForValidation() && !currentPuzzle.hasContradiction) {
        data.randomGuessProcess = new RandomGuessProcess(currentPuzzle, props.interfaceId);
        currentCPU.addProcess(data.randomGuessProcess, 5, () => {
          data.randomGuessProcess = null;
          Vue.nextTick(() => { startRandomGuessProcessIfNeeded(); });
        });
      }
    }

    function cashIn() {
      incomeTracker.push([Date.now(), currentStatus.puzzleReward(options.currentSize)]);
      currentStatus.puzzleCompleted(options.currentSize);
      updateAverages();
      assignNewPuzzle();
    }

    onPuzzleChange(() => {
      stopAllProcesses();
      currentPuzzle = currentPuzzles[props.interfaceId];
      console.log(currentPuzzle.n);
      data.puzzleUUID += 1;
    });

    function assignNewPuzzle(puzzleId: string = "") {
      stopAllProcesses();

      if (puzzleId == "") {
        currentPuzzle = Vue.reactive(randomOfSize(options.currentSize));
      } else {
        currentPuzzle = Vue.reactive(fromSimonThatamId(puzzleId));
      }
      currentPuzzles[props.interfaceId] = currentPuzzle;

      console.log("New puzzle started: " + toSimonTathamId(currentPuzzle));

      currentPuzzle.onContradiction(() => {
        stopAllProcesses();
        if (options.autoRevertOnContradiction) {
          revert();
        }
      });
      currentPuzzle.onAction((a: Action) => {
        if (data.randomGuessProcess) {
          currentCPU.killProcess(data.randomGuessProcess);
          data.randomGuessProcess = null;
        }
        if (currentPuzzle.hasContradiction) {
          return;
        }
        if (currentPuzzle.isReadyForValidation()) {
          if (options.autoValidateOn && !data.validationProcess) {
            startValidate();
          }
          return;
        }
        processLauncher.onAction(currentPuzzle, a);
        startRandomGuessProcessIfNeeded();
      });

      data.puzzleUUID += 1;
      processLauncher.startInitialProcessesIfNeeded(currentPuzzle);
      startRandomGuessProcessIfNeeded();
    }

    Vue.onMounted(async () => {
      loadTowers(2);
      loadTowers(3);
      loadTowers(4);
      loadTowers(5);
      loadTowers(6);
      loadTowers(7);
      loadTowers(8);
      await loadTowers(9);
      currentPuzzle = currentPuzzles[props.interfaceId];
      if (currentPuzzle.n == 0) {
        assignNewPuzzle();
      }
    });

    return () => {
      let items = [];

      const optionsComponent = Vue.h(TowersOptionsComponent, {
        interfaceId: props.interfaceId,
        options: options,
        onRandomGuessOn: () => { startRandomGuessProcessIfNeeded(); },
        onSizeChange: () => { assignNewPuzzle() },
      });
      items.push(optionsComponent);

      const interfaceProps: any = {
        undoUnlocked: towersUpgrades.undo.isUnlocked,
        guessUnlocked: towersUpgrades.guess.isUnlocked,
        interfaceId: props.interfaceId,
        guesses: currentPuzzle.guesses,
        isValidating: data.validationProcess !== null,
        isDone: data.validationProcess !== null && data.validationProcess.isDone,
        isCorrect: data.validationProcess !== null && data.validationProcess.returnValue,
        size: options.currentSize,
        puzzle: currentPuzzle,
      }
      interfaceProps[InterfaceHandlers.RESTART] = restart;
      interfaceProps[InterfaceHandlers.START_VALIDATE] = startValidate;
      interfaceProps[InterfaceHandlers.STOP_VALIDATE] = stopValidate;
      interfaceProps[InterfaceHandlers.UNDO] = () => {
        stopAllProcesses();
        currentPuzzle.undo();
      };
      interfaceProps[InterfaceHandlers.ABANDON_GUESS] = () => {
        stopValidate();
        stopAllProcesses();
        currentPuzzle.abandonGuess();
      };
      interfaceProps[InterfaceHandlers.MARK_GUESS_AS_IMPOSSIBLE] = () => {
        stopValidate();
        stopAllProcesses();
        currentPuzzle.markGuessAsImpossible();
      };
      const interfaceStatus = Vue.h(InterfaceStatusComponent, interfaceProps)
      items.push(interfaceStatus);

      const towersProps: any = {
        key: 'puzzle-' + data.puzzleUUID,
        puzzle: currentPuzzle,
        validationProcess: data.validationProcess,
      }

      const flexItems: any = [];
      const towersComponent = Vue.h(TowersComponent, towersProps);
      flexItems.push(towersComponent);

      if (data.validationProcess && options.showValidation) {
        const validator = Vue.h(TowersValidatorComponent, {
          process: data.validationProcess,
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
          assignNewPuzzle(id);
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
