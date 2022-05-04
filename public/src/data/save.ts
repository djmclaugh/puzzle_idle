import Vue from '../vue.js'

import { currentTicker } from './ticker.js'
import { currentStatus } from './status.js'
import { currentCPU } from './cpu.js'
import { currentPower } from './power.js'
import TowersOptions, { currentOptions } from './towers/towers_options.js'
import { towersUpgrades } from './towers/towers_upgrades.js'
import { puzzles, assignNewPuzzle } from './towers/towers_puzzles.js'

const version = "0.0.3";
export const START = '["0.0.3","0","0,0","0|0,0,0,0,1,1,0","1,1","[2]|0",["2,4"]]';

export function saveToCookie() {
  document.cookie = toSaveState() + ";SameSite=Strict";
}

export function loadFromCookie() {
  const state = document.cookie;
  console.log("fetching cookie: " + state);
  if (state)   {
    fromSaveState(state);
  }
}

export function toSaveState(): string {
  return JSON.stringify([
    version,
    Math.floor(currentTicker.lastTick / 100).toString(36),
    currentStatus.toState(),
    currentPower.toState(),
    currentCPU.toState(),
    towersUpgrades.toState(),
    currentOptions.map(o => o.toState()),
  ]);
}

export function fromSaveState(s: string) {
  const states = JSON.parse(s);
  const version = states[0];
  if (version == "0.0.1") {
    currentTicker.lastTick = Date.now();
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
  } else {
    currentTicker.lastTick = Number.parseInt(states[1], 36) * 100;
    if (currentTicker.lastTick == 0) {
      currentTicker.lastTick = Date.now();
    }
    currentStatus.fromState(states[2]);
    currentPower.fromState(states[3]);
    currentCPU.fromState(states[4]);
    towersUpgrades.fromState(states[5]);
    for (let i = 0; i < states[6].length; ++i) {
      if (currentOptions.length <= i) {
        currentOptions.push(Vue.reactive(new TowersOptions()));
      }
      currentOptions[i].fromState(states[6][i]);
    }
  }
  for (let i = 0; i < currentOptions.length; ++i) {
    if (puzzles.length < i || !puzzles[i] || puzzles[i].n != currentOptions[i].currentSize) {
      assignNewPuzzle(i);
    }
  }
}
