import Vue from '../vue.js'
import { currentCPU } from './cpu.js'
import { currentRAM } from './ram.js'

function interfaceRamRequirements(size: number) {
  let total = 0;
  // One byte for the possibilities of each cell
  // Note: if there are more then 8 possibilities, then it take more than one
  // byte to store which possibility has been eliminated and which hasn't.
  // TODO: figure out if I want to do anything about that
  total +=  size * size;
  // One byte for each potential hint
  // Note: this can probably be lower
  // TODO: figure out if I want to do antyhing about that
  total += (size * size) + (4 * size);

  return total;
}

export class StatusData {
  public interfaces: number[] = [2];
  public interfacesCurrentSize: number[] = [2];
  public money: number = 0;

  public constructor() {
    currentRAM.allocate("interface-0", interfaceRamRequirements(this.interfacesCurrentSize[0]));
  }

  public get cpuSpeedUpgradeCost(): number {
    return 5 * currentCPU.maxSpeed;
  }

  public canAffordCpuSpeedUpgrade(): boolean {
    return this.money >= this.cpuSpeedUpgradeCost;
  }

  public upgradeCpuSpeed(): void {
    this.money -= this.cpuSpeedUpgradeCost;
    currentCPU.maxSpeed += 1;
    if (currentCPU.speed == currentCPU.maxSpeed - 1) {
      currentCPU.speed = currentCPU.maxSpeed;
    }
  }

  public get cpuCoresUpgradeCost(): number {
    return Math.pow(10, currentCPU.cores);
  }

  public canAffordCpuCoresUpgrade(): boolean {
    return this.money >= this.cpuCoresUpgradeCost;
  }

  public upgradeCpuCores(): void {
    this.money -= this.cpuCoresUpgradeCost;
    currentCPU.cores += 1;
  }

  public get numberOfInterfacesUpgradeCost(): number {
    return Math.pow(100, this.interfaces.length);
  }

  public canAffordNumberOfInterfacesUpgrade(): boolean {
    return this.money >= this.numberOfInterfacesUpgradeCost;
  }

  public upgradeNumberOfInterfaces(): void {
    this.money -= this.numberOfInterfacesUpgradeCost;
    this.interfaces.push(2);
    this.interfacesCurrentSize.push(2);
  }

  public puzzleReward(size: number): number {
    return Math.pow(size + 6, size - 2);
  }

  public puzzleCompleted(size: number): void {
    this.money += this.puzzleReward(size);
  }
}

export const currentStatus: StatusData = Vue.reactive(new StatusData());
