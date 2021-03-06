import Vue from '../vue.js'

import { currentTicker } from './ticker.js'

import BiomassPower from './power/biomass.js'

// Tidal energy
// Solar energy
// Wind energy (Air)
// Hydro energy (Water)
// Geothermal energy (Fire)
// Biomass energy (Earth)

// Biomass
// https://surgeaccelerator.com/biomass-power-plant/

export default class Power {
  public manualCrank: boolean = false;
  public lastTickDrain: number = 0;
  public crankLevel: number = 0;
  public biomassPower: BiomassPower = new BiomassPower();

  public toState(): string {
    return this.crankLevel.toString(36) + "|" + this.biomassPower.toState();
  }
  public fromState(s: string) {
    const split = s.split("|");
    this.crankLevel = parseInt(split[0], 36);
    this.biomassPower.fromState(split[1]);
  }

  public get generatedPower(): number {
    let total = 0;
    if (this.manualCrank) {
      total += Math.pow(2, this.crankLevel);
    }
    total += this.biomassPower.currentOutput;
    return total;
  }

  public get power(): number {
    return this.generatedPower;
  }

  public drain(amount: number) {
    this.lastTickDrain += amount;
  }
}

export const currentPower: Power = Vue.reactive(new Power());
currentTicker.onTick(() => {
  currentPower.biomassPower.processTick();
  const extra = currentPower.power - currentPower.lastTickDrain;
  currentPower.lastTickDrain = 0;
})
