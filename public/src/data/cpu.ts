import PriorityQueue from '../util/priority_queue.js'

export interface Process {
  ramRequirement: number,
}

export default class CPU {
  public usedRam: number = 0;
  public maxRam: number = 20;
  public speed: number = 1;
  public coresInUse: number = 0;
  public cores: number = 1;

  private activeProcesses: Set<Process> = new Set();
  private queue: PriorityQueue<Process> = new PriorityQueue();
}
