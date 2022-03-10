import { HintFace } from './hint_face.js'

export type VisibilityInfo = {
  seen: boolean,
  hidden: boolean,
};

export type CellVisibilityInfo = {
  [key in HintFace]: VisibilityInfo;
};

export function newCellVisibilityInfo(): CellVisibilityInfo {
  return {
    [HintFace.WEST]: {seen: false, hidden: false},
    [HintFace.NORTH]: {seen: false, hidden: false},
    [HintFace.EAST]: {seen: false, hidden: false},
    [HintFace.SOUTH]: {seen: false, hidden: false},
  };
}

export default class CellVisibilityTracker {
  public info: CellVisibilityInfo[][] = [];

  constructor(n: number) {
    for (let i = 0; i < n; ++i) {
      this.info.push([]);
      for (let j = 0; j < n; ++j) {
        this.info[i].push(newCellVisibilityInfo());
      }
    }
  }

  // Returns whether something changed or not.
  addInfo(row: number, col: number, face: HintFace, seen: boolean): boolean {
    if (seen && !this.info[row][col][face].seen) {
      this.info[row][col][face].seen = true;
      return true;
    } else if (!this.info[row][col][face].hidden) {
      this.info[row][col][face].hidden = true;
      return true;
    }
    return false;
  }

  // Returns whether something changed or not.
  removeInfo(row: number, col: number, face: HintFace, seen: boolean): boolean {
    if (seen && this.info[row][col][face].seen) {
      this.info[row][col][face].seen = false;
      return true;
    } else if (this.info[row][col][face].hidden) {
      this.info[row][col][face].hidden = false;
      return true;
    }
    return false;
  }

  hasContradiction(row: number, col: number, face: HintFace): boolean {
    return this.info[row][col][face].seen && this.info[row][col][face].hidden;
  }
}
