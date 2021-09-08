import Vue from '../vue.js'

export class StatusData {
  public money: number = 0;
  public ram: number = 4;
  public validationSpeed: number = 5;

  public get validationSpeedUpgradeCost(): number {
    return this.validationSpeed;
  }

  public canAffordValidationSpeedUpgrade(): boolean {
    return this.money >= this.validationSpeedUpgradeCost;
  }

  public upgradeValidationSpeed(): void {
    this.money -= this.validationSpeedUpgradeCost;
    this.validationSpeed += 1;
  }
}

export const currentStatus: StatusData = Vue.reactive(new StatusData())
