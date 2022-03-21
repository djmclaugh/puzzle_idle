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

export default class TowersUpgrades {
  public constructor() {}

  public interfaces: number[] = [2];

  public sizeUpgradeCost(i: number): number {
    return Math.pow(10, i * 2) * 5 * currentStatus.puzzleReward(this.interfaces[i]);
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
    () => currentCPU.cores > 0,
  );

  public readonly autoCashIn = new UnlockableUpgrade(
    "Auto Cash In",
    "Automatically cash in on successful validation.",
    1,
    () => currentCPU.cores > 0,
  );

  public readonly randomGuessProcess = new UnlockableUpgrade(
    "Random Guess Process",
    "Makes a random guesse if no other proccesses are running on the puzzle.",
    20,
    () => currentCPU.cores > 0 && towersUpgrades.guess.isUnlocked,
  );

  public readonly onlyChoiceInColumnRowProcess = new UnlockableUpgrade(
    "Only Choice In Row/Column Process",
    "When a possibility is removed, check which other cells in that row/columns have that possibility.\n" +
    "If only one cell has that possibility, then that cell must be that possibility.",
    1,
    () => currentCPU.cores > 0,
  );

  public readonly removeFromColumnRowProcess = new UnlockableUpgrade(
    "Remove From Row/Column Process",
    "When a cell is set, remove that possibility from the other cells of that row/column.",
    5,
    () => currentCPU.cores > 0 && towersUpgrades.removePossibility.isUnlocked,
  );

  public readonly oneViewProcess = new UnlockableUpgrade(
    "1 View Process",
    "If the view hint is a 1, then you know that the first tower has to be the tallest tower.\n",
    1,
    () => currentCPU.cores > 0,
  );

  public readonly notOneViewProcess = new UnlockableUpgrade(
    "Not 1 View Process",
    "If the view hint is not a 1, then you know that the first tower can't be the tallest tower.\n",
    5,
    () => currentCPU.cores > 0 && towersUpgrades.removePossibility.isUnlocked,
  );

  public readonly maxViewProcess = new UnlockableUpgrade(
    "Max View Process",
    "If the view hint is the size of the puzzle, then you know that the towers need to be in order.",
    1,
    () => currentCPU.cores > 0,
  );

  public readonly simpleViewProcess = new UnlockableUpgrade(
    "Initial View Process",
    "Combines the \"1 View\", \"Not 1 View\", and \"Max View\" processes into one process.",
    10,
    () => towersUpgrades.oneViewProcess.isUnlocked && towersUpgrades.notOneViewProcess.isUnlocked && towersUpgrades.maxViewProcess.isUnlocked,
  );

  public readonly betterSimpleViewProcess = new UnlockableUpgrade(
    "Better Initial View Process",
    "If a tower of height ℎ is in the 𝑖-th cell away from the edge in a puzzle of size 𝑛, then, at most, you will see the towers that are in front of the tower of height ℎ, the tower of height ℎ itself, and the towers taller than ℎ.\n" +
    "You will see, at most, (𝑖 - 1) + 1 + (𝑛 - ℎ) = 𝑖 + 𝑛 - ℎ towers.\n"+
    "For example, if you put a tower of height 4 in the second cell of a row of a puzzle of size 5, then you will see, at most 2 + 5 - 4 = 3 towers.\n" +
    "This means that if the view hint is 4 or 5, then the second cell can't be 4 or more.",
    1,
    () => towersUpgrades.interfaces[0] > 3 && towersUpgrades.simpleViewProcess.isUnlocked,
  );

  public readonly visibility = new UnlockableUpgrade(
    "Visibility Info",
    "Let's you mark possibilities as seen/hidden.\n" +
    "A green bar means that if that possibility is in the solution, then it must be seen from that side.\n" +
    "A red bar means that if that possibility is in the solution, then it must be hidden from that side.\n" +
    "(Note: Currently, the are no ways to manually set visibility info, only processes can do it)",
    10,
    () => towersUpgrades.interfaces[0] > 2,
  );

  public readonly tooShortTooFarUpgrade = new UnlockableUpgrade(
    "Too Short Too Far Inference",
    "If a possibility is shorter than how far it is from the edge, then it must be hidden from that edge.\n" +
    "For example, a tower height 2 in the 3rd cell from the edge will be hidden.\n" +
    "This inference will be applied as part of the initial view process.",
    20,
    () => towersUpgrades.visibility.isUnlocked && towersUpgrades.simpleViewProcess.isUnlocked,
  );

  public readonly twosViewUpgrade = new UnlockableUpgrade(
    "2 View Upgrade",
    "If a view hint is a 2, then only the first cell and the tallest tower will be seen.\n" +
    "Mark all other possibilities as hidden.\n" +
    "This inference will be applied as part of the initial view process.",
    20,
    () => towersUpgrades.visibility.isUnlocked && towersUpgrades.simpleViewProcess.isUnlocked,
  );

  public readonly detectVisibilityProcess = new UnlockableUpgrade(
    "Detect Visibility Process",
    "If a possibility is taller or equal to the maximum of all previous cells, mark it as seen.\n" +
    "If a possibility is shorter or equal to the minimum of any previous cell, mark it as hidden.",
    10,
    () => towersUpgrades.visibility.isUnlocked,
  );

  public readonly removeContradictoryVisibilityProcess = new UnlockableUpgrade(
    "Remove Contradictory Visibility Process",
    "If a possibility is marked as both seen and hidden, then remove it from the cell.",
    10,
    () => towersUpgrades.cellVisibilityCountProcess.isUnlocked || towersUpgrades.heightVisibilityCountProcess.isUnlocked,
  );

  public readonly cellVisibilityCountProcess = new UnlockableUpgrade(
    "Cell Visibility Count Process",
    "If all possibilities in a cell are seen/hidden, then that cell must be seen/hidden.\n" +
    "If the number of cells that must be seen is equal to the hint, then we know that the other cells must be hidden.\n" +
    "If the number of cells that must be hidden is equal to the size of the puzzle minus the hint, then we know that the other cells must be seen.",
    10,
    () => towersUpgrades.detectVisibilityProcess.isUnlocked,
  );

  public readonly cellMustBeHiddenProcess = new UnlockableUpgrade(
    "Cell Must Be Hidden Process",
    "If all possibilities in a cell are hidden, then that cell must be hidden.\n" +
    "This means that at least one cell in front must have a tower that's taller than the hidden cell's shortest possibility.",
    20,
    () => towersUpgrades.detectVisibilityProcess.isUnlocked,
  );

  public readonly cellMustBeSeenProcess = new UnlockableUpgrade(
    "Cell Must Be Seen Process",
    "If all possibilities in a cell are seen, then that cell must be seen.\n" +
    "This means that all of the cells in front can't be taller than the seen cell's tallest possibility.",
    20,
    () => towersUpgrades.detectVisibilityProcess.isUnlocked,
  );

  public readonly heightVisibilityCountProcess = new UnlockableUpgrade(
    "Height Visibility Count Process",
    "If all possibilities for a certain height withing a row/column are seen/hidden, then that the tower of that height must be seen/hidden.\n" +
    "If the number of heights that must be seen is equal to the hint, then we know that the other heights must be hidden.\n" +
    "If the number of heights that must be hidden is equal to the size of the puzzle minus the hint, then we know that the other heights must be seen.",
    10,
    () => towersUpgrades.detectVisibilityProcess.isUnlocked,
  );

  public readonly heightMustBeHiddenProcess = new UnlockableUpgrade(
    "Height Must Be Hidden Process",
    "If all possibilities for a certain height are hidden, then the tower of that height must be hidden.\n" +
    "This means that at least one of the taller heights must appear in front of hidden height's latest possibility.",
    20,
    () => towersUpgrades.detectVisibilityProcess.isUnlocked,
  );

  public readonly heightMustBeSeenProcess = new UnlockableUpgrade(
    "Height Must Be Seen Process",
    "If all possibilities for a certain height are seen, then the tower of that height must be seen.\n" +
    "This means that all taller heights must appear behind of seen height's earliest possibility.",
    20,
    () => towersUpgrades.detectVisibilityProcess.isUnlocked,
  );

  public readonly autoRevertOnContradiction = new UnlockableUpgrade(
    "Auto Revert On Contradiction",
    "Automatically marks the last guess as impossible if a contradiction is notices.",
    10,
    () => towersUpgrades.guess.isUnlocked,
  );

  public readonly removePossibility = new UnlockableUpgrade(
    "Possibility Removal",
    "Control-click to mark a possibility as impossible.",
    5,
    () => towersUpgrades.interfaces[0] > 2,
  );

  public readonly undo = new UnlockableUpgrade(
    "Undo",
    "Let's you undo one move at a time instead of restarting from the begining.",
    5,
    () => towersUpgrades.interfaces[0] > 2,
  );

  public readonly markHintSatisfied = new UnlockableUpgrade(
    "Mark Hint As Satisfied",
    "Click on a view hint to mark is as satisfied (to help you keep track of which hints you no longer need to pay attention to).",
    10,
    () => towersUpgrades.interfaces[0] > 3,
  );

  public readonly guess = new UnlockableUpgrade(
    "Guessing",
    "Shift-click to make a guess. Allows you to easily go back to before the guess was made.",
    20,
    () => towersUpgrades.interfaces[0] > 3 && towersUpgrades.undo.isUnlocked,
  );
}

export const towersUpgrades: TowersUpgrades = Vue.reactive(new TowersUpgrades());
