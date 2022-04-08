import Vue from '../vue.js'
import PriorityQueue from '../util/priority_queue.js'
import Process from './process.js'

import { currentPower } from './power.js'
import { currentTicker } from './ticker.js'

type callback = (returnValue: any) => void;

export default class CPU {
  public maxSpeed: number = 1;
  public cores: number = 1;
  public partialTick: number = 0;

  public activeProcesses: Set<Process<any>> = new Set();
  public queue: PriorityQueue<Process<any>> = new PriorityQueue();
  private standbyQueue: Map<string, [Process<any>, number, callback]> = new Map();
  private callbacks: Map<string, callback> = new Map();
  public paused: boolean = false;

  public get coresInUse(): number {
    return this.activeProcesses.size;
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
    this.fillActiveCores();
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

  public fillActiveCores() {
    while (this.canAddNextProcess()) {
      this.activeProcesses.add(this.queue.extractNext()!);
    }
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

  public powerForSpeed(speed: number): number {
    return Math.ceil(100 * this.activeProcesses.size * Math.pow(speed, 2)) / 100;
  }

  public speedForPower(power: number): number {
    if (this.activeProcesses.size == 0) {
      return 0;
    }
    return Math.min(this.maxSpeed, Math.floor(100 * Math.pow(power / this.activeProcesses.size, 0.5)) / 100);
  }
}

export const currentCPU: CPU = Vue.reactive(new CPU());

currentTicker.onTick(() => {
  const speed = currentCPU.speedForPower(currentPower.power);
  currentCPU.partialTick += speed;
  currentPower.drain(currentCPU.powerForSpeed(speed));
  while (currentCPU.partialTick >= 10) {
    currentCPU.partialTick -= 10;
    currentCPU.onTick();
  }
  currentCPU.fillActiveCores();
})
