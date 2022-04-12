import Vue from '../vue.js'
import { currentCPU } from './cpu.js'

export class StatusData {
  private money: number = 0;
  private allMoney: number = 0;

  public toState(): string {
    return this.money.toString(36) + "," + this.allMoney.toString(36);
  }
  public fromState(s: string) {
    const split = s.split(',');
    this.money = parseInt(split[0], 36);
    this.allMoney = parseInt(split[1], 36);
  }

  public constructor() {}

  public gainMoney(n: number) {
    this.money += n;
    this.allMoney += n;
  }

  public spendMoney(n: number) {
    this.money -= n;
  }

  public get currentMoney(): number {
    return this.money;
  }

  public get allTimeMoney(): number {
    return this.allMoney;
  }

  public get cpuSpeedUpgradeCost(): number {
    return Math.pow(5, currentCPU.maxSpeed - 1);
  }

  public canAffordCpuSpeedUpgrade(): boolean {
    return this.money >= this.cpuSpeedUpgradeCost;
  }

  public upgradeCpuSpeed(): void {
    this.money -= this.cpuSpeedUpgradeCost;
    currentCPU.maxSpeed += 1;
  }

  public get cpuCoresUpgradeCost(): number {
    return Math.floor(5 * Math.pow(1.5, currentCPU.cores - 1));
  }

  public canAffordCpuCoresUpgrade(): boolean {
    return this.money >= this.cpuCoresUpgradeCost;
  }

  public upgradeCpuCores(): void {
    this.money -= this.cpuCoresUpgradeCost;
    currentCPU.cores += 1;
  }

  public puzzleReward(size: number): number {
    return Math.pow(size, 2*size - 4);
  }

  public puzzleCompleted(size: number): void {
    this.gainMoney(this.puzzleReward(size));
  }
}

export const currentStatus: StatusData = Vue.reactive(new StatusData());
