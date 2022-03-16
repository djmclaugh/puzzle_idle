import { DoubleKeyMap } from '../../util/multi_key_map.js'
import { HintFace, ALL_FACES } from './hint_face.js'

export type VisibilityInfo = {
  seen: boolean,
  hidden: boolean,
};

export type DirectionalVisibilityInfo = {
  [key in HintFace]: VisibilityInfo;
};

export function newDirectionalVisibilityInfo(): DirectionalVisibilityInfo {
  return {
    [HintFace.WEST]: {seen: false, hidden: false},
    [HintFace.NORTH]: {seen: false, hidden: false},
    [HintFace.EAST]: {seen: false, hidden: false},
    [HintFace.SOUTH]: {seen: false, hidden: false},
  };
}

export function mergeVisibilityInfo(a: DirectionalVisibilityInfo, b: DirectionalVisibilityInfo): DirectionalVisibilityInfo {
  const info = newDirectionalVisibilityInfo();
  for (let f of ALL_FACES) {
    info[f] = {
      seen: a[f].seen || b[f].seen,
      hidden: a[f].hidden || b[f].hidden,
    }
  }
  return info;
}

export default class VisibilityTracker {

  private rowColMap: DoubleKeyMap<number, number, DirectionalVisibilityInfo> = new DoubleKeyMap();
  private rowValMap: DoubleKeyMap<number, number, DirectionalVisibilityInfo> = new DoubleKeyMap();
  private colValMap: DoubleKeyMap<number, number, DirectionalVisibilityInfo> = new DoubleKeyMap();

  constructor() {}

  public getWithRowCol(row: number, col: number): DirectionalVisibilityInfo {
    let info = this.rowColMap.get(row, col);
    if (info === undefined) {
      info = newDirectionalVisibilityInfo();
      this.rowColMap.set(row, col, info);
    }
    return info;
  }

  public getWithRowVal(row: number, val: number): DirectionalVisibilityInfo {
    let info = this.rowValMap.get(row, val);
    if (info === undefined) {
      info = newDirectionalVisibilityInfo();
      this.rowValMap.set(row, val, info);
    }
    return info;
  }

  public getWithColVal(col: number, val: number): DirectionalVisibilityInfo {
    let info = this.colValMap.get(col, val);
    if (info === undefined) {
      info = newDirectionalVisibilityInfo();
      this.colValMap.set(col, val, info);
    }
    return info;
  }

  public getTowerVisibility(row: number, col: number, val: number): DirectionalVisibilityInfo {
    return {
      [HintFace.NORTH]: this.getWithColVal(col, val)[HintFace.NORTH],
      [HintFace.SOUTH]: this.getWithColVal(col, val)[HintFace.SOUTH],
      [HintFace.EAST]: this.getWithRowVal(row, val)[HintFace.EAST],
      [HintFace.WEST]: this.getWithRowVal(row, val)[HintFace.WEST],
    }
  }

  // Returns true if it was new information
  private addInfo(info: VisibilityInfo, seen: boolean) : boolean {
    if (seen) {
      if (info.seen) {
        return false;
      } else {
        info.seen = true;
        return true;
      }
    } else {
      if (info.hidden) {
        return false;
      } else {
        info.hidden = true;
        return true;
      }
    }
  }

  // Returns true if the information to remove was actually there
  private removeInfo(info: VisibilityInfo, seen: boolean) : boolean {
    if (seen) {
      if (!info.seen) {
        return false;
      } else {
        info.seen = false;
        return true;
      }
    } else {
      if (!info.hidden) {
        return false;
      } else {
        info.hidden = false;
        return true;
      }
    }
  }

  public addRowColInfo(row: number, col: number, face: HintFace, seen: boolean): boolean {
    const info = this.getWithRowCol(row, col)[face];
    return this.addInfo(info, seen);
  }
  public addRowValInfo(row: number, val: number, face: HintFace, seen: boolean): boolean {
    const info = this.getWithRowVal(row, val)[face];
    return this.addInfo(info, seen);
  }
  public addColValInfo(col: number, val: number, face: HintFace, seen: boolean): boolean {
    const info = this.getWithColVal(col, val)[face];
    return this.addInfo(info, seen);
  }

  public removeRowColInfo(row: number, col: number, face: HintFace, seen: boolean): boolean {
    const info = this.getWithRowCol(row, col)[face];
    return this.removeInfo(info, seen);
  }
  public removeRowValInfo(row: number, val: number, face: HintFace, seen: boolean): boolean {
    const info = this.getWithRowVal(row, val)[face];
    return this.removeInfo(info, seen);
  }
  public removeColValInfo(col: number, val: number, face: HintFace, seen: boolean): boolean {
    const info = this.getWithColVal(col, val)[face];
    return this.removeInfo(info, seen);
  }
}
