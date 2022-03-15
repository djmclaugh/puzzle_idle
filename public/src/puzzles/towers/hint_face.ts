export enum HintFace {
  WEST = 1,
  NORTH = 2,
  EAST = 3,
  SOUTH = 4,
}

export const ALL_FACES = [
  HintFace.WEST,
  HintFace.NORTH,
  HintFace.EAST,
  HintFace.SOUTH,
]

export function faceToString(face: HintFace) {
  switch (face) {
    case HintFace.WEST:
      return "West";
    case HintFace.NORTH:
      return "North";
    case HintFace.EAST:
      return "East";
    case HintFace.SOUTH:
      return "South";
  }
}

export function isVertical(face: HintFace): boolean {
  return face % 2 == 0;
}

export function isHorizontal(face: HintFace): boolean {
  return !isVertical(face);
}

export function isReverse(face: HintFace): boolean {
  return face > 2;
}

export function isClockwise(face: HintFace): boolean {
  return face == HintFace.NORTH || face == HintFace.EAST;
}

export function getCoordinates(face: HintFace, hintIndex: number, index: number, n: number): [number, number] {
  let x = hintIndex;
  let y = index;
  if (isReverse(face)) {
    y = n - y - 1;
  }
  if (!isClockwise(face)) {
    x = n - x - 1;
  }
  if (isHorizontal(face)) {
    let temp = x;
    x = y;
    y = temp;
  }
  return [x, y];
}

export function next(face: HintFace): HintFace {
  return (face % 4) + 1;
}
