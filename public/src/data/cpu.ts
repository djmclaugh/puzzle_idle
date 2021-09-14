import PriorityQueue from '../util/priority_queue.js'
import RAM from './ram.js'

export interface Process {
  ramRequirement: number,
}

export default class CPU {
  public speed: number = 1;
  public coresInUse: number = 0;
  public cores: number = 1;

  private activeProcesses: Set<Process> = new Set();
  private queue: PriorityQueue<Process> = new PriorityQueue();

  public constructor(private ram: RAM) {}
}
