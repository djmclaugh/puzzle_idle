import Vue from '../../vue.js'

import ValidationProcess from '../processes/towers/validation_process.js'
import ProcessLauncher from '../processes/towers/process_launcher.js'

import Towers from '../../puzzles/towers/towers.js'
import { randomOfSize } from '../../puzzles/towers/towers_loader.js'
import { fromSimonTathamId } from '../../puzzles/towers/util.js'

import {currentOptions} from './towers_options.js'

import { currentStatus } from '../status.js'
import { currentCPU } from '../cpu.js'

const callbacks: (() => void)[][] = []

export const puzzles: Towers[] = [];
export const processLaunchers: ProcessLauncher[] = [];
export const validations: (ValidationProcess|null)[] = Vue.reactive([]);

export function stopAllProcesses(i: number) {
  if (processLaunchers[i]) {
    processLaunchers[i].stopAllProcesses();
  }
  const v = validations[i];
  if (v) {
    currentCPU.killProcess(v);
  }
  validations[i] = null;
}

export function assignNewPuzzle(i: number, puzzleId: string = "") {
  stopAllProcesses(i);
  if (puzzleId == "") {
    puzzles[i] = Vue.reactive(randomOfSize(currentOptions[i].currentSize));
  } else {
    puzzles[i] = Vue.reactive(fromSimonTathamId(puzzleId));
  }
  processLaunchers[i] = new ProcessLauncher(puzzles[i], currentOptions[i], i);

  puzzles[i].onContradiction(() => {
    stopAllProcesses(i);
    if (currentOptions[i].autoRevertOnContradiction) {
      revert(i);
    }
  });

  puzzles[i].onAction(() => {
    if (puzzles[i].isReadyForValidation()) {
      if (currentOptions[i].autoValidateOn && !validations[i]) {
        startValidate(i);
      }
    }
  });

  notifyChange(i);
}

export function onPuzzleChange(i: number, callback: () => void) {
  while (callbacks.length <= i) {
    callbacks.push([]);
  }
  callbacks[i].push(callback);
}

export function startValidate(i: number): void {
  stopAllProcesses(i);
  const v = new ValidationProcess(puzzles[i], i);
  validations[i] = v;

  currentCPU.addProcess(v, 10, (isValid: boolean) => {
    if (currentStatus.allTimeMoney == 0) {
      currentStatus.latestValidationResult = isValid ? 1 : -1;
    }
    if (isValid && currentOptions[i].autoCashInOn) {
      cashIn(i);
    } else if (!isValid && currentOptions[i].autoRevertOnContradiction) {
      revert(i);
    }
  });
}

export function cashIn(i: number) {
  currentStatus.puzzleCompleted(currentOptions[i].currentSize);
  assignNewPuzzle(i);
}

export function revert(i: number) {
  stopAllProcesses(i);
  if (puzzles[i].guesses.length == 0) {
    puzzles[i].restart();
  } else {
    puzzles[i].markGuessAsImpossible();
  }
  processLaunchers[i].startInitialProcessesIfNeeded();
}

export function stopValidate(i: number) {
  const v = validations[i];
  if (v) {
    if (v.returnValue) {
      cashIn(i);
    } else {
      stopAllProcesses(i);
    }
  }
}

export function notifyChange(i: number) {
  if (callbacks[i]) {
    for (const c of callbacks[i]) { c(); }
  }
}
