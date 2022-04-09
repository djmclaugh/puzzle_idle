import Vue from '../vue.js'

import { currentStatus } from './status.js'
import { currentCPU } from './cpu.js'
import { currentPower } from './power.js'
import TowersOptions, { currentOptions } from './towers/towers_options.js'
import { towersUpgrades } from './towers/towers_upgrades.js'
import { currentPuzzles, notifyChange } from './towers/towers_puzzles.js'
import { randomOfSize, LOADED_TOWERS } from '../puzzles/towers/towers_loader.js'

const version = "0.0.1";

export function saveToCookie() {
  document.cookie = toSaveState() + ";SameSite=Strict";
}

export function loadFromCookie() {
  const state = document.cookie;
  if (state)   {
    fromSaveState(state);
  }
}

export function toSaveState(): string {
  return JSON.stringify([
    version,
    currentStatus.toState(),
    currentPower.toState(),
    currentCPU.toState(),
    towersUpgrades.toState(),
    currentOptions.map(o => o.toState()),
  ]);
}

export function fromSaveState(s: string) {
  const states = JSON.parse(s);
  currentStatus.fromState(states[1]);
  currentPower.fromState(states[2]);
  currentCPU.fromState(states[3]);
  towersUpgrades.fromState(states[4]);
  for (let i = 0; i < states[5].length; ++i) {
    if (currentOptions.length <= i) {
      currentOptions.push(Vue.reactive(new TowersOptions()));
    }
    currentOptions[i].fromState(states[5][i]);
  }
  let shouldNotify = false;
  if (LOADED_TOWERS.size > 0) {
    for (let i = 0; i < currentOptions.length; ++i) {
      if (currentPuzzles.length < i || currentPuzzles[i].n != currentOptions[i].currentSize) {
        shouldNotify = true;
        currentPuzzles[i] = Vue.reactive(randomOfSize(currentOptions[i].currentSize));
      }
    }
    if (shouldNotify) {
      notifyChange();
    }
  }
}
