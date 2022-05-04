import Vue from '../vue.js'

import { currentPower } from './power.js'

type callback = () => void;

export default class Ticker {
  public lastTick: number = 0;
  public hasStarted: boolean = false;
  private callbacks: Set<callback> = new Set();

  public onTick(c: callback) {
    this.callbacks.add(c);
  }

  public removeListener(c: callback) {
    this.callbacks.delete(c);
  }

  public processTickCallbacks() {
    for (const c of this.callbacks) {
      c();
    }
  }

  private processTick() {
    let newTimestamp = Date.now();
    let diff = newTimestamp - this.lastTick;

    if (currentPower.power > 0 || currentPower.biomassPower.manualCollect) {
      // If there is power of a button is pressed, only catch up at a rate of
      // 1000 ticks per tick.
      // But otherwise, nothing will happen so just skip all of the ticks.
      let ticks = Math.min(1000, Math.floor(diff / 100));
      this.lastTick += ticks * 100;
      for (let i = 0; i < ticks; ++i) {
        currentTicker.processTickCallbacks();
      }
    } else {
      this.lastTick = newTimestamp;
      currentTicker.processTickCallbacks();
    }
  }

  public startTicking() {
    if (this.hasStarted) {
      throw new Error("Should only be started once");
    }
    if (this.lastTick == 0) {
      this.lastTick = Date.now();
    }
    this.hasStarted = true;
    this.processTick();
    // Make ticker tick 10 times per second
    setInterval(() => {
      this.processTick();
    }, 100);
  }
}

export const currentTicker: Ticker = Vue.reactive(new Ticker());
