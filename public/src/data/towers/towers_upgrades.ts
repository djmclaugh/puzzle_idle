import Vue from '../../vue.js'

import { currentStatus } from '../status.js'
import { currentCPU } from '../cpu.js'

export class UnlockableUpgrade {
  private unlocked: boolean = false;
  public constructor(
      public readonly name: string,
      public readonly description: string,
      public readonly cost: number,
      public readonly isAvailable: () => boolean,
    ) {}

  public get canAfford(): boolean {
    return this.cost <= currentStatus.money;
  }
  public get isUnlocked(): boolean {
    return this.unlocked;
  }
  public unlock() {
    currentStatus.money -= this.cost;
    this.unlocked = true;
  }
}

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

  public readonly autoValidate = new UnlockableUpgrade(
    "Auto Validate",
    "Automatically start the validation process once each cell has a value.",
    1,
    () => {return currentCPU.cores > 0;},
  );

  public readonly autoCashIn = new UnlockableUpgrade(
    "Auto Cash In",
    "Automatically cash in on successful validation.",
    1,
    () => {return currentCPU.cores > 0;},
  );

  public readonly randomGuessProcess = new UnlockableUpgrade(
    "Random Guess Process",
    "Makes a random guesse if no other proccesses are running on the puzzle.",
    20,
    () => {return currentCPU.cores > 0 && towersUpgrades.guess.isUnlocked;},
  );

  public readonly onlyChoiceInColumnRowProcess = new UnlockableUpgrade(
    "Only Choice In Row/Column Process",
    "When a possibility is removed, check how many times that possibility is available in the other cells of that row/column.\n" +
    "If only one cell in the row/column can be that possibility, then that cell must be that possibility.",
    1,
    () => {return currentCPU.cores > 0},
  );

  public readonly removeFromColumnRowProcess = new UnlockableUpgrade(
    "Remove From Row/Column Process",
    "When a cell is set, remove that possibility from the other cells in that row/column.",
    5,
    () => {return currentCPU.cores > 0 && towersUpgrades.removePossibility.isUnlocked;},
  );

  public readonly oneViewProcess = new UnlockableUpgrade(
    "1 View Process",
    "If the view hint is a 1, then you know that the first tower has to be the tallest tower.\n",
    1,
    () => {return currentCPU.cores > 0;},
  );

  public readonly notOneViewProcess = new UnlockableUpgrade(
    "Not 1 View Process",
    "If the view hint is not a 1, then you know that the first tower can't be the tallest tower.\n",
    5,
    () => {return currentCPU.cores > 0 && towersUpgrades.removePossibility.isUnlocked;},
  );

  public readonly maxViewProcess = new UnlockableUpgrade(
    "Max View Process",
    "If the view hint is the size of the puzzle, then you know that the towers need to be in order.",
    1,
    () => {return currentCPU.cores > 0;},
  );

  public readonly simpleViewProcess = new UnlockableUpgrade(
    "Simple View Process",
    "Combines the 1 view, the not 1 view, and the max view processes into one.",
    10,
    () => {return towersUpgrades.oneViewProcess.isUnlocked && towersUpgrades.notOneViewProcess.isUnlocked && towersUpgrades.maxViewProcess.isUnlocked;},
  );

  public readonly betterSimpleViewProcess = new UnlockableUpgrade(
    "Better Simple View Process",
    "If a tower of height ℎ is in the 𝑖-th cell away from the edge in a puzzle of size 𝑛, then, at most, you will see the towers that are in front of the tower of height ℎ, the tower of height ℎ itself, and the towers taller than ℎ.\n" +
    "You will see, at most, (𝑖 - 1) + 1 + (𝑛 - ℎ) = 𝑖 + 𝑛 - ℎ towers.\n"+
    "For example, if you put a tower of height 4 in the second cell of a row of a puzzle of size 5, then you will see, at most 2 + 5 - 4 = 3 towers.\n" +
    "This means that if the view hint is 4 or 5, then the second cell can't be 4 or more.",
    1,
    () => {return false && towersUpgrades.simpleViewProcess.isUnlocked}
  );

  public readonly autoRevertOnContradiction = new UnlockableUpgrade(
    "Auto Revert On Contradiction",
    "Automatically marks the last guess as impossible if a contradiction is notices.",
    10,
    () => {return towersUpgrades.guess.isUnlocked;}
  );

  public readonly removePossibility = new UnlockableUpgrade(
    "Possibility Removal",
    "Control-click to mark a possibility as impossible.",
    5,
    () => {return towersUpgrades.interfaces[0] > 2;}
  );

  public readonly undo = new UnlockableUpgrade(
    "Undo",
    "Let's you undo one move at a time instead of restarting from the begining.",
    5,
    () => {return towersUpgrades.interfaces[0] > 2;}
  );

  public readonly markHintSatisfied = new UnlockableUpgrade(
    "Mark Hint As Satisfied",
    "Click on a view hint to mark is as satisfied (to help you keep track of which hints you no longer need to pay attention to).",
    10,
    () => {return towersUpgrades.interfaces[0] > 3;}
  );

  public readonly guess = new UnlockableUpgrade(
    "Guessing",
    "Shift-click to make a guess. Allows you to easily go back to before the guess was made.",
    20,
    () => {return towersUpgrades.interfaces[0] > 3 || towersUpgrades.undo.isUnlocked;}
  );
}

export const towersUpgrades: TowersUpgrades = Vue.reactive(new TowersUpgrades());
