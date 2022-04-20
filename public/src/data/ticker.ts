import Vue from '../vue.js'

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
    let ticks = Math.floor(diff / 100);
    this.lastTick += ticks * 100;
    for (let i = 0; i < ticks; ++i) {
      currentTicker.processTickCallbacks();
    }
  }

  public startTicking() {
    if (this.hasStarted) {
      throw new Error("Should only be started once");
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
