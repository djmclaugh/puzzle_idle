// Biomass
// https://surgeaccelerator.com/biomass-power-plant/

export default class BiomassPower {
  public level = 0;
  public biomassMilligrams: number = 0;
  public manualCollect: boolean = false;
  public collectLevel: number = 1;
  public milligramsPerTick: number = 10;
  // J per g
  public furnaceEfficiency: number = 5;
  public furnaceCapacity: number = 10;
  public furnaceOn: boolean = false;

  // In grams
  public get biomass(): number {
    return this.biomassMilligrams / 1000;
  }

  // In grams per second
  public get furnaceSpeed(): number {
    return this.milligramsPerTick / 100;
  }

  // In Watts
  public get currentOutput(): number {
      if (!this.furnaceOn) {
        return 0;
      }
      return Math.min(this.biomassMilligrams, this.milligramsPerTick) * this.furnaceEfficiency / 100;
  }

  // In Watts
  public get maxOutput(): number {
      return this.milligramsPerTick * this.furnaceEfficiency / 100;
  }

  public processTick() {
    if (this.furnaceOn) {
      this.biomassMilligrams -= this.milligramsPerTick;
      this.biomassMilligrams = Math.max(0, this.biomassMilligrams);
    }
    if (this.manualCollect) {
      this.biomassMilligrams += this.collectLevel * 100;
      this.biomassMilligrams = Math.min(this.furnaceCapacity * 1000, this.biomassMilligrams);
    }
  }
}
