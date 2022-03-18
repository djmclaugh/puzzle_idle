import Vue from '../vue.js'
import PriorityQueue from '../util/priority_queue.js'
import Process from './process.js'

type callback = (returnValue: any) => void;

export default class CPU {
  private _speed: number = 1;
  public maxSpeed: number = 1;
  public cores: number = 0;

  private intervalID: number = 0;
  public activeProcesses: Set<Process<any>> = new Set();
  public queue: PriorityQueue<Process<any>> = new PriorityQueue();
  private standbyQueue: Map<string, [Process<any>, number, callback]> = new Map();
  private callbacks: Map<string, callback> = new Map();
  public boosted: boolean = false;
  public paused: boolean = false;

  public get coresInUse(): number {
    return this.activeProcesses.size;
  }

  public get speed(): number {
    return this._speed;
  }

  public set speed(newSpeed: number) {
    this._speed = newSpeed;
    clearInterval(this.intervalID);
    let parity = false;
    let timestamp = Date.now();
    this.intervalID = setInterval(() => {
      let newTimestamp = Date.now();
      let diff = newTimestamp - timestamp;
      let ticks = Math.floor(diff * this._speed / 500);
      timestamp += ticks * 500 / this._speed;
      if (this.paused) {
        ticks = Math.min(ticks, 1);
      }
      for (let i = 0; i < ticks; ++i) {
        if (parity) {
          if (!this.paused) {
            this.onTick();
          }
        } else {
          if (this.boosted) {
            this.onTick();
            this.onBoostTick();
          }
        }
        // Check if the next process can be added
        while (this.canAddNextProcess()) {
          const next = this.queue.extractNext()!;
          this.activeProcesses.add(next);
        }
        parity = !parity;
      }
    }, 100);
  }

  public constructor() {
    this.speed = this._speed;
  }

  public addProcess<R>(p: Process<R>, priority: number, c: callback): boolean {
    if (this.callbacks.has(p.processId)) {
      // If the process with the same ID is active, add the new process to the
      // standby queue.
      if (!this.standbyQueue.has(p.processId)) {
        for (const active of this.activeProcesses) {
          if (active.processId == p.processId) {
            this.standbyQueue.set(p.processId, [p, priority, c]);
            return true;
          }
        }
      }
      // Otherwise, don't add this process at all
      return false;
    }
    this.callbacks.set(p.processId, c);
    this.queue.addItem(p, priority);
    return true;
  }

  public killProcess(p: Process<any>) {
    this.activeProcesses.delete(p);
    this.queue.remove(p);
    this.callbacks.delete(p.processId);
    this.standbyQueue.delete(p.processId);
  }

  public isActive(p: Process<any>): boolean {
    return this.activeProcesses.has(p);
  }

  private canAddNextProcess(): boolean {
    const hasFreeCore = this.activeProcesses.size < this.cores; this.activeProcesses.size < this.cores;
    const hasNext = this.queue.peakNext() !== undefined;
    return hasFreeCore && hasNext;
  }

  public onTick() {
    // Run each active process
    const toRemove: Set<Process<any>> = new Set();
    for (let p of this.activeProcesses) {
      const startTimestamp = Date.now();
      const isDone = p.tick();
      const endTimestamp = Date.now();
      const duration = endTimestamp - startTimestamp;
      if (endTimestamp - startTimestamp > 100) {
        console.log(`Warning: Tick from process ${p.processId} took ${duration}ms.`)
      }
      if (isDone) {
        toRemove.add(p)
      }
    }

    // Remove processes that have terminated
    for (let p of toRemove) {
      if (this.activeProcesses.delete(p)) {
        if (this.callbacks.has(p.processId)) {
          const callback = this.callbacks.get(p.processId)!;
          this.callbacks.delete(p.processId);
          callback(p.returnValue);
        }
        if (this.standbyQueue.has(p.processId)) {
          const processInfo = this.standbyQueue.get(p.processId)!;
          this.standbyQueue.delete(p.processId);
          this.addProcess(processInfo[0], processInfo[1], processInfo[2]);
        }
      }
    }


  }

  public onBoostTick() {
    const p = this.queue.peakNext();
    if (p === undefined) {
      return;
    }
    const startTimestamp = Date.now();
    const isDone = p.tick();
    const endTimestamp = Date.now();
    const duration = endTimestamp - startTimestamp;
    if (endTimestamp - startTimestamp > 100) {
      console.log(`Warning: Tick from process ${p.processId} took ${duration}ms.`)
    }
    if (isDone) {
      this.queue.remove(p);
      this.activeProcesses.delete(p)
      if (this.callbacks.has(p.processId)) {
        const callback = this.callbacks.get(p.processId)!;
        this.callbacks.delete(p.processId);
        callback(p.returnValue);
      }
      if (this.standbyQueue.has(p.processId)) {
        const processInfo = this.standbyQueue.get(p.processId)!;
        this.standbyQueue.delete(p.processId);
        this.addProcess(processInfo[0], processInfo[1], processInfo[2]);
      }
    }
  }
}

export const currentCPU: CPU = Vue.reactive(new CPU());
// TODO: verify
// If the setInterval is done before this object is reactive, Vue will ignore
// updates done within the setInterval handler.
// This line retriggers the setInterval so that Vue now handles changes within
// the setInterval handler.
currentCPU.speed = currentCPU.speed;
