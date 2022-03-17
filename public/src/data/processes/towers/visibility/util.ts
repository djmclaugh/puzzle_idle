import { HintFace, isVertical, isReverse } from '../../../../puzzles/towers/hint_face.js'
import { TripleCollection, Triple } from '../../../../puzzles/towers/triple_collection.js'

export function ordinal(n: number): string {
  if (n == 1) {
    return '1st';
  } else if (n == 2) {
    return '2nd';
  } else if (n == 3) {
    return '3rd';
  } else {
    return n + 'th';
  }
}

export function possibilitiesForTower(marks: TripleCollection, height: number, rowIndex: number, face: HintFace): Triple[] {
  return isVertical(face) ?
      Array.from(marks.getWithColVal(rowIndex, height)).map(p => {return {row: p, col: rowIndex, val: height}}) :
      Array.from(marks.getWithRowVal(rowIndex, height)).map(p => {return {row: rowIndex, col: p, val: height}});
}

export function ordinalPossibilitiesForTower(marks: TripleCollection, height: number, rowIndex: number, face: HintFace) {
  let possibilities = isVertical(face) ?
      Array.from(marks.getWithColVal(rowIndex, height)) :
      Array.from(marks.getWithRowVal(rowIndex, height));
  if (isReverse(face)) {
    possibilities = possibilities.map(p => marks.n - p - 1);
  }
  possibilities.sort();
  return possibilities;
}
