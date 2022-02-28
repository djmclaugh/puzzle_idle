import Vue from '../../vue.js'

import { currentStatus } from '../status.js'

export class TowersUpgrades {
  public constructor() {}

  public interfaces: number[] = [2];

  public sizeUpgradeCost(i: number): number {
    return Math.pow(10, i * 2) * 3 * currentStatus.puzzleReward(this.interfaces[i]);
  }
  public canAffordSizeUpgrade(i: number): boolean {
    return currentStatus.money >= this.sizeUpgradeCost(i);
  }
  public upgradeSize(i: number) {
    currentStatus.money -= this.sizeUpgradeCost(i);
    this.interfaces[i] += 1;
  }

  public extraInterfaceCost(): number {
    return Math.pow(10, (this.interfaces.length - 1) * 2) * 5;
  }
  public canAffordExtraInterface(): boolean {
    return currentStatus.money >= this.extraInterfaceCost();
  }
  public unlockExtraInterface() {
    currentStatus.money -= this.extraInterfaceCost();
    this.interfaces.push(2);
  }

  public readonly autoValidateCost: number = 1;
  public autoValidateUnlocked: boolean = false;
  public canAffordAutoValidate(): boolean {
    return currentStatus.money >= this.autoValidateCost;
  }
  public unlockAutoValidate() {
    currentStatus.money -= this.autoValidateCost;
    this.autoValidateUnlocked = true;
  }

  public readonly autoCashInCost: number = 1;
  public autoCashInUnlocked: boolean = false;
  public canAffordAutoCashIn(): boolean {
    return currentStatus.money >= this.autoCashInCost;
  }
  public unlockAutoCashIn() {
    currentStatus.money -= this.autoCashInCost;
    this.autoCashInUnlocked = true;
  }

  public readonly randomGuessProcessCost: number = 1;
  public randomGuessProcessUnlocked: boolean = false;
  public canAffordRandomGuessProcess(): boolean {
    return currentStatus.money >= this.randomGuessProcessCost;
  }
  public unlockRandomGuessProcess() {
    currentStatus.money -= this.randomGuessProcessCost;
    this.randomGuessProcessUnlocked = true;
  }

  public readonly removeFromColumnRowProcessCost: number = 10;
  public removeFromColumnRowProcessUnlocked: boolean = false;
  public canAffordRemoveFromColumnRowProcess(): boolean {
    return currentStatus.money >= this.removeFromColumnRowProcessCost;
  }
  public unlockRemoveFromColumnRowProcess() {
    currentStatus.money -= this.removeFromColumnRowProcessCost;
    this.removeFromColumnRowProcessUnlocked = true;
  }

  public readonly simpleViewProcessCost: number = 10;
  public simpleViewProcessUnlocked: boolean = false;
  public canAffordSimpleViewProcess(): boolean {
    return currentStatus.money >= this.simpleViewProcessCost;
  }
  public unlockSimpleViewProcess() {
    currentStatus.money -= this.simpleViewProcessCost;
    this.simpleViewProcessUnlocked = true;
  }

  public readonly autoRevertOnContradictionCost: number = 1;
  public autoRevertOnContradictionUnlocked: boolean = false;
  public canAffordAutoRevertOnContradiction(): boolean {
    return currentStatus.money >= this.autoRevertOnContradictionCost;
  }
  public unlockAutoRevertOnContradiction() {
    currentStatus.money -= this.autoRevertOnContradictionCost;
    this.autoRevertOnContradictionUnlocked = true;
  }

  public readonly removePossibilityCost: number = 5;
  public removePossibilityUnlocked: boolean = false;
  public canAffordRemovePossibility(): boolean {
    return currentStatus.money >= this.removePossibilityCost;
  }
  public unlockRemovePossibility() {
    currentStatus.money -= this.removePossibilityCost;
    this.removePossibilityUnlocked = true;
  }

  public readonly undoCost: number = 10;
  public undoUnlocked: boolean = false;
  public canAffordUndo(): boolean {
    return currentStatus.money >= this.removePossibilityCost;
  }
  public unlockUndo() {
    currentStatus.money -= this.undoCost;
    this.undoUnlocked = true;
  }

  public readonly guessCost: number = 100;
  public guessUnlocked: boolean = false;
  public canAffordGuess(): boolean {
    return currentStatus.money >= this.guessCost;
  }
  public unlockGuess() {
    currentStatus.money -= this.guessCost;
    this.guessUnlocked = true;
  }
}

export const towersUpgrades: TowersUpgrades = Vue.reactive(new TowersUpgrades());
