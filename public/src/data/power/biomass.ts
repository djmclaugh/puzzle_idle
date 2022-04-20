// Biomass
// https://surgeaccelerator.com/biomass-power-plant/

export default class BiomassPower {
  public level = 0;
  public biomassMilligrams: number = 0;
  public manualCollect: boolean = false;
  public collectLevel: number = 0;
  public milligramsPerTick: number = 50;
  // J per g
  public furnaceEfficiency: number = 2;
  public furnaceCapacity: number = 10;
  public furnaceOn: boolean = false;

  public toState(): string {
    return [
      this.level.toString(36),
      this.biomassMilligrams.toString(36),
      this.collectLevel.toString(36),
      this.milligramsPerTick.toString(36),
      this.furnaceEfficiency.toString(36),
      this.furnaceCapacity.toString(36),
      this.furnaceOn ? "1" : "0",
    ].join(",");
  }
  public fromState(s: string) {
    const split = s.split(",");
    this.level = parseInt(split[0], 36);
    this.biomassMilligrams = parseInt(split[1], 36);
    this.collectLevel = parseInt(split[2], 36);
    this.milligramsPerTick = parseInt(split[3], 36);
    this.furnaceEfficiency = parseInt(split[4], 36);
    this.furnaceCapacity = parseInt(split[5], 36);
    this.furnaceOn = split[6] == "1";
  }

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
      this.biomassMilligrams += Math.pow(2, this.collectLevel) * 100;
      this.biomassMilligrams = Math.min(this.furnaceCapacity * 1000, this.biomassMilligrams);
    }
  }
}
