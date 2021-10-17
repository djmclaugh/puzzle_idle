import PriorityQueue from '../util/priority_queue.js'
import Process from './process.js'
import RAM from './ram.js'

type callback = (returnValue: any) => void;

export default class CPU {
  private _speed: number = 1;
  public cores: number = 1;

  private intervalID: number;
  private activeProcesses: Set<Process<any>> = new Set();
  private queue: PriorityQueue<Process<any>> = new PriorityQueue();
  private callbacks: Map<string, callback> = new Map();

  public get coresInUse(): number {
    return this.activeProcesses.size;
  }

  public get speed(): number {
    return this._speed;
  }

  public set speed(newSpeed: number) {
    this._speed = newSpeed;
    clearInterval(this.intervalID);
    this.intervalID = setInterval(() => {
      this.onTick()
    }, 1000 / this._speed);
  }

  public constructor(private ram: RAM) {
    this.intervalID = setInterval(() => {
      this.onTick()
    }, 1000 / this._speed);
  }

  public addProcess<R>(p: Process<R>, priority: number, c: callback): boolean {
    if (this.callbacks.has(p.processId)) {
      console.log(`Not adding process ${p.processId} since process with same name already in queue`);
      return false;
    }
    this.queue.addItem(p, priority);
    this.callbacks.set(p.processId, c);
    return true;
  }

  public killProcess(p: Process<any>) {
    this.callbacks.delete(p.processId);
    if (this.activeProcesses.delete(p)) {
      this.ram.deallocate(p.processId);
    } else {
      this.queue.remove(p);
    }
  }

  private canAddNextProcess(): boolean {
    const hasFreeCore = this.activeProcesses.size < this.cores;
    const next = this.queue.peakNext();
    const hasEnoughRam = next !== undefined && next.ramRequirement <= this.ram.remaining;
    return hasFreeCore && hasEnoughRam;
  }

  public onTick() {
    // Check if the next process can be added
    while (this.canAddNextProcess()) {
      const next = this.queue.extractNext()!;
      this.activeProcesses.add(next);
      this.ram.allocate(next.processId, next.ramRequirement);
    }

    // Run each active process
    const toRemove: Set<Process<any>> = new Set();
    for (let p of this.activeProcesses) {
      if (p.tick()) {
        toRemove.add(p)
      }
    }

    // Remove processes that have terminated
    for (let p of toRemove) {
      this.activeProcesses.delete(p);
      this.ram.deallocate(p.processId);
      if (this.callbacks.has(p.processId)) {
        this.callbacks.get(p.processId)!(p.returnValue);
        this.callbacks.delete(p.processId);
      }
    }
  }
}
