// Biomass
// https://surgeaccelerator.com/biomass-power-plant/

export default class BiomassPower {
  public level = 0;
  // In gramms
  public currentBiomass: number = 0;

  public manualCollect: boolean = false;
  public collectLevel: number = 0;

  public speedLevel: number = 1;
  // from 0 to 100
  public speedPercentage: number = 0;
  public get setSpeed(): number {
    return this.maxSpeed * this.speedPercentage / 100;
  }
  public get maxSpeed(): number {
    return this.speedLevel;
  }
  // Can't burn biomass we don't have
  public get currentSpeed(): number {
    if (this.currentBiomass >= this.setSpeed / 10) {
      return this.setSpeed;
    } else {
      return 0;
    }
  }

  public efficiencyLevel: number = 1;
  // J per g
  public get furnaceEfficiency(): number {
    return this.efficiencyLevel;
  }

  public capacityLevel: number = 0;
  public get furnaceCapacity(): number {
    const base = Math.pow(10, 1 + Math.floor(this.capacityLevel / 9))
    return base * ((this.capacityLevel % 9) + 1);
  };
  public get capacityUpgradeAmount(): number {
    return Math.pow(10, 1 + Math.floor(this.capacityLevel / 9))
  }
  public get capacityUpgradeCost(): number {
    return (1 + Math.floor(this.capacityLevel / 9)) * (this.capacityUpgradeAmount / 10)
  }

  public toState(): string {
    return [
      this.level.toString(36),
      this.currentBiomass.toString(36),
      this.speedPercentage.toString(36),
      this.collectLevel.toString(36),
      this.speedLevel.toString(36),
      this.efficiencyLevel.toString(36),
      this.capacityLevel.toString(36),
    ].join(",");
  }
  public fromState(s: string) {
    const split = s.split(",");
    this.level = parseInt(split[0], 36);
    this.currentBiomass = parseInt(split[1], 36);
    this.speedPercentage = parseInt(split[2], 36);
    this.collectLevel = parseInt(split[3], 36);
    this.speedLevel = parseInt(split[4], 36);
    this.efficiencyLevel = parseInt(split[5], 36);
    this.capacityLevel = parseInt(split[6], 36);
  }

  // In Watts
  public get currentOutput(): number {
    return this.currentSpeed * this.furnaceEfficiency;
  }
  // In Watts
  public get maxOutput(): number {
      return this.maxSpeed * this.furnaceEfficiency;
  }

  public processTick() {
    this.currentBiomass -= this.currentSpeed / 10;
    this.currentBiomass = Math.max(0, this.currentBiomass);
    if (this.manualCollect) {
      this.currentBiomass += Math.pow(2, this.collectLevel) / 10;
      this.currentBiomass = Math.min(this.furnaceCapacity, this.currentBiomass);
    }
  }
}
