import Vue from '../vue.js'
import { currentCPU } from './cpu.js'
import { currentPower } from './power.js'
import { puzzles } from './towers/towers_puzzles.js'
import { towersUpgrades } from './towers/towers_upgrades.js'

export class StatusData {
  private money: number = 0;
  private allMoney: number = 0;
  private incomeTracker: [number, number][] = [];
  public lastHourAveragePerMinute: number = 0;
  private updateAverageTimeoutId: number = 0;

  public latestValidationResult: -1|0|1 = 0;

  public toState(): string {
    return this.money.toString(36)
        + "," + this.allMoney.toString(36)
        + "," + this.incomeTracker.map(i => Math.floor(i[0]/1000).toString(36) + "-" + i[1].toString(36)).join("|");
  }
  public fromState(s: string, version: string) {
    if (version == "0.0.1" || version == "0.0.2") {
      const split = s.split(',');
      this.money = parseInt(split[0], 36);
      this.allMoney = parseInt(split[1], 36);
      this.incomeTracker = [];
    } else {
      const split = s.split(',');
      this.money = parseInt(split[0], 36);
      this.allMoney = parseInt(split[1], 36);
      if (split[2] == "") {
        this.incomeTracker = [];
      } else {
        this.incomeTracker = split[2].split("|").map(s => {
          const [a, b] = s.split("-");
          return [Number.parseInt(a, 36) * 1000, Number.parseInt(b, 36)];
        });
      }
    }
    this.updateAverage();
  }

  public constructor() {
    this.updateAverage();
  }

  private updateAverage() {
    clearTimeout(this.updateAverageTimeoutId)
    const now = Date.now();
    const hourAgo = now - (60 * 60 * 1000)

    let firstRelevantIndex = -1;
    for (let i = 0; i < this.incomeTracker.length; ++i) {
      if (firstRelevantIndex == -1 && this.incomeTracker[i][0] > hourAgo) {
        firstRelevantIndex = i;
        break;
      }
    }
    if (firstRelevantIndex != -1) {
      this.incomeTracker.splice(0, firstRelevantIndex);
    }

    let hourSum = 0;
    for (let i = 0; i < this.incomeTracker.length; ++i) {
      hourSum += this.incomeTracker[i][1];
    }
    this.lastHourAveragePerMinute = hourSum / 60;

    // Update in 2 seconds
    this.updateAverageTimeoutId = setTimeout(() => this.updateAverage(), 2000);
  }

  public get nextStep(): string {
    if (this.allTimeMoney == 0) {
      if (!puzzles[0] || puzzles[0].n < 2) {
        return "";
      }
      if (this.latestValidationResult == 0) {
        if (!puzzles[0].isReadyForValidation()) {
          return 'Solve the puzzle on the left. <a target="_blank" href="https://www.conceptispuzzles.com/index.aspx?uri=puzzle/skyscrapers/rules">How to play towers/skyscrapers (external link)</a>';
        }
        if (currentCPU.coresInUse == 0) {
          return 'Start the validation routine by clicking the "Validate" button.';
        }
        if (currentPower.generatedPower == 0) {
          return 'Validation routine added to CPU. Use the hand crank to power it.';
        }
        if (currentPower.generatedPower > 0) {
          return 'Keep cranking!';
        }
      }
      if (this.latestValidationResult == -1) {
        return 'Looks like there\'s a mistake in your solution. Try again!';
      }
      if (this.latestValidationResult == 1) {
        return 'Puzzle solved! Click the "Cash In" button for your reward.';
      }
    }
    if (currentPower.crankLevel <= 0 || currentCPU.maxSpeed <= 1) {
      return 'Try upgrading your generator and your CPU\'s max speed. You\'ll need to upgrade both.';
    }
    if (towersUpgrades.interfaces[0] < 3) {
      return 'That\'s it for the tutorial! Last hint: Upgrading the puzzle size lets you make money much faster!';
    }
    return "";
  }

  public gainMoney(n: number) {
    this.money += n;
    this.allMoney += n;
    this.incomeTracker.push([Date.now(), n]);
    this.updateAverage();
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
