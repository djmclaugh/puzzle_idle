import Vue from '../vue.js'
import PriorityQueue from '../util/priority_queue.js'
import Process from './process.js'
import RAM, { currentRAM } from './ram.js'

type callback = (returnValue: any) => void;

export default class CPU {
  private _speed: number = 1;
  public maxSpeed: number = 1;
  public cores: number = 0;

  private intervalID: number = 0;
  public activeProcesses: Set<Process<any>> = new Set();
  public queue: PriorityQueue<Process<any>> = new PriorityQueue();
  private callbacks: Map<string, callback> = new Map();
  public boostedProcess: Process<any>|null = null;

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
      for (let i = 0; i < ticks; ++i) {
        if (parity) {
          this.onTick();
        } else {
          this.onBoostTick();
        }
        parity = !parity;
      }
    }, 100);
  }

  public constructor(private ram: RAM) {
    this.speed = this._speed;
  }

  public addProcess<R>(p: Process<R>, priority: number, c: callback): boolean {
    if (this.callbacks.has(p.processId)) {
      return false;
    }
    this.callbacks.set(p.processId, c);
    this.queue.addItem(p, priority);

    while (this.canAddNextProcess()) {
      const next = this.queue.extractNext()!;
      this.activeProcesses.add(next);
      this.ram.allocate(next.processId, next.ramRequirement);
    }
    return true;
  }

  public killProcess(p: Process<any>) {
    if (this.activeProcesses.delete(p)) {
      this.ram.deallocate(p.processId);
      this.callbacks.delete(p.processId);
    }
    if (this.queue.remove(p)) {
      this.callbacks.delete(p.processId);
    }
    if (this.boostedProcess == p) {
      this.boostedProcess = null;
    }
  }

  public isActive(p: Process<any>): boolean {
    return this.activeProcesses.has(p);
  }

  private canAddNextProcess(): boolean {
    const hasFreeCore = this.activeProcesses.size < this.cores;
    const next = this.queue.peakNext();
    const hasEnoughRam = next !== undefined && next.ramRequirement <= this.ram.remaining;
    return hasFreeCore && hasEnoughRam;
  }

  public onTick() {
    // Run each active process
    const toRemove: Set<Process<any>> = new Set();
    for (let p of this.activeProcesses) {
      const startTimestamp = Date.now();
      const isDone = p.tick();
      const endTimestamp = Date.now();
      const duration = endTimestamp - startTimestamp;
      if (endTimestamp - startTimestamp > 10) {
        console.log(`Warning: Tick from process ${p.processId} took ${duration}ms.`)
      }
      if (isDone) {
        toRemove.add(p)
      }
    }

    // Remove processes that have terminated
    for (let p of toRemove) {
      if (this.activeProcesses.delete(p)) {
        this.ram.deallocate(p.processId);
        if (this.boostedProcess == p) {
          this.boostedProcess = null;
        }
        if (this.callbacks.has(p.processId)) {
          const callback = this.callbacks.get(p.processId)!;
          this.callbacks.delete(p.processId);
          callback(p.returnValue);
        }
      }
    }

    // Check if the next process can be added
    while (this.canAddNextProcess()) {
      const next = this.queue.extractNext()!;
      this.activeProcesses.add(next);
      this.ram.allocate(next.processId, next.ramRequirement);
    }
  }

  public onBoostTick() {
    if (!this.boostedProcess) {
      return;
    }
    const p = this.boostedProcess;
    const startTimestamp = Date.now();
    const isDone = p.tick();
    const endTimestamp = Date.now();
    const duration = endTimestamp - startTimestamp;
    if (endTimestamp - startTimestamp > 10) {
      console.log(`Warning: Tick from process ${p.processId} took ${duration}ms.`)
    }
    // Make sure process hasn't changed during its tick.
    if (isDone && p === this.boostedProcess) {
      // Manually bosted processes might be from the queue.
      this.queue.remove(p);
      if (this.activeProcesses.delete(p)) {
          this.ram.deallocate(p.processId);
      }
      if (this.callbacks.has(p.processId)) {
        const callback = this.callbacks.get(p.processId)!;
        this.callbacks.delete(p.processId);
        callback(p.returnValue);
      }
      this.boostedProcess = null;
    }

    // Check if the next process can be added
    while (this.canAddNextProcess()) {
      const next = this.queue.extractNext()!;
      this.activeProcesses.add(next);
      this.ram.allocate(next.processId, next.ramRequirement);
    }
  }
}

export const currentCPU: CPU = Vue.reactive(new CPU(currentRAM));
// TODO: verify
// If the setInterval is done before this object is reactive, Vue will ignore
// updates done within the setInterval handler.
// This line retriggers the setInterval so that Vue now handles changes within
// the setInterval handler.
currentCPU.speed = currentCPU.speed;
