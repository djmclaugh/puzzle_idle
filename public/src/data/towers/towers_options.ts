// Order is arbitrary, but must be preserved to not break save states.
// If a field is removed, it should be set to the empty string.
// If a field is added, it should be added to the end.
const booleanKeys: ((keyof TowersOptions)|"")[] = [
  "autoValidateOn",
  "autoCashInOn",
  "showValidation",
  "autoRevertOnContradiction",
  "randomGuessOn",
  "onlyInRowColumnOn",
  "removeOnSetOn",
  "detectVisibilityOn",
  "removeContradictoryVisibilityOn",
  "cellVisibilityCountOn",
  "cellMustBeHiddenOn",
  "cellMustBeSeenOn",
  "heightVisibilityCountOn",
  "heightMustBeHiddenOn",
  "heightMustBeSeenOn",
  "oneViewOn",
  "notOneViewOn",
  "maxViewOn",
  "simpleViewOn",
  "betterSimpleViewOn",
]

export default class TowersOptions {
  public currentSize: number = 2;
  public autoValidateOn: boolean = false;
  public autoCashInOn: boolean = false;
  public showValidation: boolean = true;
  public autoRevertOnContradiction: boolean = false;
  public randomGuessOn: boolean = false;
  public onlyInRowColumnOn: boolean = false;
  public removeOnSetOn: boolean = false;
  public detectVisibilityOn: boolean = false;
  public removeContradictoryVisibilityOn: boolean = false;
  public cellVisibilityCountOn: boolean = false;
  public cellMustBeHiddenOn: boolean = false;
  public cellMustBeSeenOn: boolean = false;
  public heightVisibilityCountOn: boolean = false;
  public heightMustBeHiddenOn: boolean = false;
  public heightMustBeSeenOn: boolean = false;
  public oneViewOn: boolean = false;
  public notOneViewOn: boolean = false;
  public maxViewOn: boolean = false;
  public simpleViewOn: boolean = false;
  public betterSimpleViewOn: boolean = false;

  // Options that are not saved
  public showPuzzleId: boolean = false;

  public toState(): string {
    let boolNum = 0;
    for (let i = 0; i < booleanKeys.length; ++i) {
      if (booleanKeys[i] != "" && this[booleanKeys[i] as keyof TowersOptions]) {
        boolNum += Math.pow(2, i);
      }
    }
    return this.currentSize.toString(36) + "," + boolNum.toString(36);
  }
  public fromState(s: string) {
    const split = s.split(',');
    this.currentSize = parseInt(split[0], 36);
    let boolNum = parseInt(split[1], 36);
    for (let i = 0; i < booleanKeys.length; ++i) {
      if (booleanKeys[i] != "") {
        // @ts-ignore
        this[booleanKeys[i]] = (boolNum % 2) == 1;
        boolNum = boolNum >> 1;
      }
    }
  }
}

export const currentOptions: TowersOptions[] = [];
