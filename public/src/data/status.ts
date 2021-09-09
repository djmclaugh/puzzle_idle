import Vue from '../vue.js'
import CPU from './cpu.js'

export class StatusData {
  public interfaces: number[] = [2];
  public interfacesCurrentSize: number[] = [2];
  public money: number = 0;
  public cpu: CPU = new CPU();

  public get usedRam() {
    return this.cpu.usedRam;
  }

  public get maxRam() {
    return this.cpu.maxRam;
  }

  public get cpuSpeed() {
    return this.cpu.speed;
  }

  public get cpuCoresInUse() {
    return this.cpu.coresInUse;
  }

  public get cpuCores() {
    return this.cpu.cores;
  }

  public interfaceUpgradeCost(id: number): number {
    return Math.pow(this.interfaces[id], 2);
  }

  public canAffordInterfaceUpgrade(id: number): boolean {
    return this.money >= this.interfaceUpgradeCost(id);
  }

  public upgradeInterface(id: number): void {
    this.money -= this.interfaceUpgradeCost(id);
    this.interfaces[id] += 1;
    this.interfacesCurrentSize[id] += 1;
  }

  public get ramUpgradeCost(): number {
    return Math.pow(this.maxRam, 2);
  }

  public canAffordRamUpgrade(): boolean {
    return this.money >= this.ramUpgradeCost;
  }

  public upgradeRam(): void {
    this.money -= this.ramUpgradeCost;
    this.cpu.maxRam += 10;
  }

  public get cpuSpeedUpgradeCost(): number {
    return this.cpuSpeed;
  }

  public canAffordCpuSpeedUpgrade(): boolean {
    return this.money >= this.cpuSpeedUpgradeCost;
  }

  public upgradeCpuSpeed(): void {
    this.money -= this.cpuSpeedUpgradeCost;
    this.cpu.speed += 1;
  }

  public get cpuCoresUpgradeCost(): number {
    return Math.pow(100, this.cpuCores);
  }

  public canAffordCpuCoresUpgrade(): boolean {
    return this.money >= this.cpuCoresUpgradeCost;
  }

  public upgradeCpuCores(): void {
    this.money -= this.cpuCoresUpgradeCost;
    this.cpu.cores += 1;
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
    return Math.pow(size, 3);
  }

  public puzzleCompleted(size: number): void {
    this.money += this.puzzleReward(size);
  }
}

export const currentStatus: StatusData = Vue.reactive(new StatusData());
