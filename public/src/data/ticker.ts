import Vue from '../vue.js'

type callback = () => void;

export default class Ticker {
  private callbacks: Set<callback> = new Set();
  public boosted: boolean = false;
  public paused: boolean = false;

  public onTick(c: callback) {
    this.callbacks.add(c);
  }

  public removeListener(c: callback) {
    this.callbacks.delete(c);
  }

  public processTick() {
    for (const c of this.callbacks) {
      c();
    }
  }
}

export const currentTicker: Ticker = Vue.reactive(new Ticker());
// Make ticker tick 10 times per second
let timestamp = Date.now();
setInterval(() => {
  let newTimestamp = Date.now();
  let diff = newTimestamp - timestamp;
  let ticks = Math.floor(diff / 100);
  timestamp += ticks * 100;
  for (let i = 0; i < ticks; ++i) {
    currentTicker.processTick();
  }
}, 100);
