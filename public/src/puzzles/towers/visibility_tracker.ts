import { TripleKeyMap } from '../../util/multi_key_map.js'
import { HintFace } from './hint_face.js'
import { Triple } from './triple_collection.js'

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

export default class VisibilityTracker {

  private TripleMap: TripleKeyMap<number, number, number, DirectionalVisibilityInfo> = new TripleKeyMap();

  constructor() {}

  public getWithTriple(t: Triple): DirectionalVisibilityInfo {
    let info = this.TripleMap.get(t.row, t.col, t.val);
    if (info === undefined) {
      info = newDirectionalVisibilityInfo();
      this.TripleMap.set(t.row, t.col, t.val, info);
    }
    return info;
  }

  // Returns true if it was new information
  public addInfo(t: Triple, face: HintFace, seen: boolean) : boolean {
    const info = this.getWithTriple(t)[face];
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
  public removeInfo(t: Triple, face: HintFace, seen: boolean) : boolean {
    const info = this.getWithTriple(t)[face]
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
}
