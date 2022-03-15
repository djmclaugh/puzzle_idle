import { HintFace } from './hint_face.js'

export enum ContradictionType {
  NO_POSSIBILITES,
  ROW,
  COLUMN,
  VIEW,
}

export interface NoPossibilitiesContradiction {
  type: ContradictionType.NO_POSSIBILITES,
  noticedOnMove: number,
  row: number,
  col: number,
}

export interface RowContradiction {
  type: ContradictionType.ROW,
  noticedOnMove: number,
  row: number,
  col1: number,
  col2: number,
}

export interface ColumnContradiction {
  type: ContradictionType.COLUMN,
  noticedOnMove: number,
  col: number,
  row1: number,
  row2: number,
}

export interface ViewContradiction {
  type: ContradictionType.VIEW,
  noticedOnMove: number,
  face: HintFace,
  rowIndex: number,
  cellIndices: number[],
}

export type TowersContradiction = NoPossibilitiesContradiction|RowContradiction|ColumnContradiction|ViewContradiction


export function isNoPossibilitesContradiction(c: TowersContradiction): c is NoPossibilitiesContradiction {
  return c.type == ContradictionType.NO_POSSIBILITES;
}
export function isRowContradiction(c: TowersContradiction): c is RowContradiction {
  return c.type == ContradictionType.ROW;
}
export function isColumnContradiction(c: TowersContradiction): c is ColumnContradiction {
  return c.type == ContradictionType.COLUMN;
}
export function isViewContradiction(c: TowersContradiction): c is ViewContradiction {
  return c.type == ContradictionType.VIEW;
}
