import Towers from './towers.js'

function isLowercase(s: string) {
  const charCode = s.charCodeAt(0);
  return s.length == 1 && "a".charCodeAt(0) <= charCode && charCode <= "z".charCodeAt(0);
}

function isDigit(s: string) {
  const charCode = s.charCodeAt(0);
  return s.length == 1 && "0".charCodeAt(0) <= charCode && charCode <= "9".charCodeAt(0);
}

// Convert puzzle to ID compatible with Simon Tatham's implementation of
// towers: https://www.chiark.greenend.org.uk/~sgtatham/puzzles/js/towers.html
export function toSimonTathamId(t: Towers): string {
  const aCode = 'a'.charCodeAt(0);
  let result = `${t.n}:`;
  result += [
    t.northHints.map(h => h == -1 ? '' : (h).toString()).join('/'),
    t.southHints.map(h => h == -1 ? '' : (h).toString()).join('/'),
    t.westHints.map(h => h == -1 ? '' : (h).toString()).join('/'),
    t.eastHints.map(h => h == -1 ? '' : (h).toString()).join('/'),
  ].join('/');

  result += ',';

  let run = 0;
  for (let y = 0; y < t.n; ++y) {
    for (let x = 0; x < t.n; ++x) {
      if (t.grid[y][x] == -1) {
        run += 1;
      } else {
        if (run > 0) {
          result += 'z'.repeat(Math.floor(run / 26));
          const leftover = run % 26;
          if (leftover > 0) {
            result += String.fromCharCode(aCode + leftover - 1);
          }
          run = 0;
        } else if (x != 0 || y != 0) {
          result += '_';
        }
        result += (t.grid[y][x] + 1)
      }
    }
  }
  result += 'z'.repeat(Math.floor(run / 26));
  const leftover = run % 26;
  if (leftover > 0) {
    result += String.fromCharCode(aCode + leftover - 1);
  }

  return result;
}

export function fromSimonTathamId(id: String): Towers {
  const aCode = 'a'.charCodeAt(0);
  const firstSplit = id.split(':');
  if (firstSplit.length != 2) {
    throw new Error('Game ID expects a colon in it.');
  }
  const size = parseInt(firstSplit[0]);
  const secondSplit = firstSplit[1].split(',');
  if (secondSplit.length > 2) {
    throw new Error('Game ID expects at most 1 comma in it.');
  }

  const nHints = [];
  const sHints = [];
  const wHints = [];
  const eHints = [];
  if (secondSplit[0].indexOf('/') != -1) {
    const view = secondSplit[0].split('/');
    if (view.length != 4 * size) {
      throw new Error(`Since size is ${size}, game ID expects exactly 4* size - 1 = ${4*size - 1} backslashes in it.`);
    }
    for (let i = 0; i < size; ++i) {
      nHints.push(view[i].length == 0 ? -1 : parseInt(view[i]));
    }
    for (let i = size; i < 2*size; ++i) {
      sHints.push(view[i].length == 0 ? -1 : parseInt(view[i]));
    }
    for (let i = 2*size; i < 3*size; ++i) {
      wHints.push(view[i].length == 0 ? -1 : parseInt(view[i]));
    }
    for (let i = 3*size; i < 4*size; ++i) {
      eHints.push(view[i].length == 0 ? -1 : parseInt(view[i]));
    }
  }

  const grid: number[][] = [];
  let gridInfo;
  if (secondSplit.length == 2) {
    gridInfo = secondSplit[1];
  } else if (secondSplit[0].indexOf('/') == -1) {
    gridInfo = secondSplit[0];
  }
  if (gridInfo) {
    let run = 0;
    let infoIndex = 0;
    for (let y = 0; y < size; ++y) {
      grid.push([]);
      for (let x = 0; x < size; ++x) {
        if (run > 0) {
          grid[y].push(-1);
          run -= 1;
        } else {
          let char = gridInfo[infoIndex++];
          while (char == '_') {
            char = gridInfo[infoIndex++];
          }
          let charCode = char.charCodeAt(0);
          if (isLowercase(char)) {
            grid[y].push(-1);
            run = charCode - aCode;
          } else {
            while (infoIndex < gridInfo.length && isDigit(gridInfo[infoIndex])) {
              char += gridInfo[infoIndex++];
            }
            grid[y].push(parseInt(char) - 1);
          }
        }
      }
    }
  } else {
    for (let y = 0; y < size; ++y) {
      grid.push([]);
      for (let x = 0; x < size; ++x) {
        grid[y].push(-1);
      }
    }
  }

  return new Towers(grid, wHints, nHints, eHints, sHints);
}
