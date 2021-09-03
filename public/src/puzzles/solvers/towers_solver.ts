import Towers, {Possibilities, view} from '../towers.js'
import { viewAnalysisSolve } from './view_analysis.js'

enum Result {
  SOLVABLE = 1,
  NOT_SOLVABLE = 2,
  UNKONWN = 3,
}

export default class TowersSolver {
  public static simpleLatinSolve(p: Towers, rowsToCheck: number[], columnsToCheck: number[]): boolean {
    const rowsToRecheck: number[] = [];
    const columnsToRecheck: number[] = [];

    // If a cell has already been filled in with a number, no other cell in that row can be that
    // number.
    for (const i of rowsToCheck) {
      const row = p.marksRow(i);
      const solved: Possibilities[] = row.filter(cell => cell.size == 1);
      const solvedSet = new Set(solved.map(cell => cell.values().next().value));
      if (solved.length != solvedSet.size) {
        // Two cells in the same row have the same value, this puzzle is impossible to solve.
        return false;
      }
      for (let j = 0; j < p.n; ++j) {
        if (row[j].size != 1) {
          solvedSet.forEach(s => {
            if (row[j].delete(s)) {
              rowsToRecheck.push(i);
              columnsToRecheck.push(j);
            }
          })
        }
      }
    }

    // If a cell has already been filled in with a number, no other cell in that column can be that
    // number.
    for (const j of columnsToCheck) {
      const column = p.marksColumn(j);
      const solved: Possibilities[] = column.filter(cell => cell.size == 1);
      const solvedSet = new Set(solved.map(cell => cell.values().next().value));
      if (solved.length != solvedSet.size) {
        // Two cells in the same column have the same value, this puzzle is impossible to solve.
        return false;
      }
      for (let i = 0; i < p.n; ++i) {
        if (column[i].size != 1) {
          solvedSet.forEach(s => {
            if (column[i].delete(s)) {
              rowsToRecheck.push(i);
              columnsToRecheck.push(j);
            }
          })
        }
      }
    }

    // If there's only one cell in a row that can be a certain number, then that cell must be that
    // number.
    for (const i of rowsToCheck) {
      const row = p.marksRow(i);
      const n = row.length;
      for (let value = 0; value < n; ++value) {
        let positionFound = -1;
        for (let j = 0; j < row.length; ++j) {
          if (row[j].has(value)) {
            if (row[j].size == 1) {
              // This value already has it's place in the row.
              // So no other cells should have this value as a possibility.
              positionFound = -1;
              break;
            } else if (positionFound == -1) {
              // This is the first cell that we encounter that can be this value.
              positionFound = j;
            } else {
              // We already encounted a cell that can be that value, so multiple cells in this row
              // can be this value so we can stop looking at this value.
              positionFound = -1;
              break;
            }
          }
        }
        if (positionFound != -1) {
          // Only one cell in the row could be this value, so this cell must be that value.
          row[positionFound].clear();
          row[positionFound].add(value);
          rowsToRecheck.push(i);
          columnsToRecheck.push(positionFound);
        }
      }
    }

    // If there's only one cell in a column that can be a certain number, then that cell must be that
    // number.
    for (const i of columnsToCheck) {
      const column = p.marksColumn(i);
      const n = column.length;
      for (let value = 0; value < n; ++value) {
        let positionFound = -1;
        for (let j = 0; j < column.length; ++j) {
          if (column[j].has(value)) {
            if (column[j].size == 1) {
              // This value already has it's place in the row.
              // So no other cells should have this value as a possibility.
              positionFound = -1;
              break;
            } else if (positionFound == -1) {
              // This is the first cell that we encounter that can be this value.
              positionFound = j;
            } else {
              // We already encounted a cell that can be that value, so multiple cells in this row
              // can be this value so we can stop looking at this value.
              positionFound = -1;
              break;
            }
          }
        }
        if (positionFound != -1) {
          // Only one cell in the row could be this value, so this cell must be that value.
          column[positionFound].clear();
          column[positionFound].add(value);
          columnsToRecheck.push(i);
          rowsToRecheck.push(positionFound);
        }
      }
    }

    if (rowsToRecheck.length == 0 && columnsToRecheck.length == 0) {
      return true;
    } else {
      return this.simpleLatinSolve(p, rowsToRecheck, columnsToRecheck);
    }
  }

  public static viewAnalysisSolve(p: Towers): void {
    const north = p.nHints;
    const east = p.eHints;
    const south = p.sHints;
    const west = p.wHints;

    const oneToN = [];
    for (let i = 0; i < p.n; ++i) {
      oneToN.push(i);
    }

    for (let i = 0; i < p.n; ++i) {
      let result;
      result = viewAnalysisSolve(north[i], p.marksColumn(i));
      this.simpleLatinSolve(p, oneToN, oneToN);
      result = viewAnalysisSolve(south[i], p.marksColumn(i).reverse());
      this.simpleLatinSolve(p, oneToN, oneToN);
      result = viewAnalysisSolve(west[i], p.marksRow(i));
      this.simpleLatinSolve(p, oneToN, oneToN);
      result = viewAnalysisSolve(east[i], p.marksRow(i).reverse());
      this.simpleLatinSolve(p, oneToN, oneToN);
    }
  }

  public static simpleViewSolve(p: Towers): void {
    const north = p.nHints;
    const east = p.eHints;
    const south = p.sHints;
    const west = p.wHints;

    for (let i = 0; i < p.n; ++i) {
      if (north[i] == 1) {
        p.marks[i][0].clear();
        p.marks[i][0].add(p.n - 1);
      } else {
        for (let d = 0; d < north[i] - 1; ++d) {
          for (let j = p.n - 1; j > d + p.n - north[i]; --j) {
            p.marks[i][d].delete(j);
          }
        }
      }

      if (south[i] == 1) {
        p.marks[i][p.n - 1].clear();
        p.marks[i][p.n - 1].add(p.n - 1);
      } else {
        for (let d = 0; d < south[i] - 1; ++d) {
          for (let j = p.n - 1; j > d + p.n - south[i]; --j) {
            p.marks[i][p.n - 1 - d].delete(j);
          }
        }
      }

      if (west[i] == 1) {
        p.marks[0][i].clear();
        p.marks[0][i].add(p.n - 1);
      } else {
        for (let d = 0; d < west[i] - 1; ++d) {
          for (let j = p.n - 1; j > d + p.n - west[i]; --j) {
            p.marks[d][i].delete(j);
          }
        }
      }

      if (east[i] == 1) {
        p.marks[p.n - 1][i].clear();
        p.marks[p.n - 1][i].add(p.n - 1);
        for (let j = 0; j < p.n - 1; ++j) {
          p.marks[p.n - 1][i].delete(j);
        }
      } else {
        for (let d = 0; d < east[i] - 1; ++d) {
          for (let j = p.n - 1; j > d + p.n - east[i]; --j) {
            p.marks[p.n - 1 - d][i].delete(j);
          }
        }
      }
    }
  }

  // Solves the puzzle as much as possible.
  // Directly modifies the puzzle.
  // This always leads to a solution if the puzzle has a unique solution.
  // Otherwise, it leaves the puzzle with all possible options that can lead to a solution.
  // This theoritically always solve the puzzle, but this is exponential, so  yeah...
  // Returns the pair [solvable, depth].
  // solvable: whether or not there's at least one solution from here.
  // depth: the minimum number simultanuous guesses that had to be made at the same time to make progress.
  public static depthSolve(p: Towers, maxDepth: number, iterationInfo: [number, number, number] = [0, 0, 0]): [Result, number] {
    // If we exceeded the max depth, then stop looking.
    // Since we don't know if it's solvable or not, it is possbily solvable.
    if (maxDepth < 0) {
      return [Result.UNKONWN, 0];
    }

    // No row can have duplicates
    for (let i = 0; i < p.n; ++i) {
      const row = p.marksRow(i);
      const solved: Possibilities[]  = [];
      const notSolved: Possibilities[] = [];
      row.forEach(cell => {
        if (cell.size == 1) {
          solved.push(cell);
        } else {
          notSolved.push(cell);
        }
      });
      const solvedSet = new Set(solved.map(cell => cell.values().next().value));
      if (solved.length != solvedSet.size) {
        // Two cells in the same row have the same value, this puzzle is impossible to solve.
        return [Result.NOT_SOLVABLE, 0];
      }
    }

    // No column can have duplicates
    for (let i = 0; i < p.n; ++i) {
      const column = p.marksColumn(i);
      const solved: Possibilities[]  = [];
      const notSolved: Possibilities[] = [];
      column.forEach(cell => {
        if (cell.size == 1) {
          solved.push(cell);
        } else {
          notSolved.push(cell);
        }
      });
      const solvedSet = new Set(solved.map(cell => cell.values().next().value));
      if (solved.length != solvedSet.size) {
        // Two cells in the same row have the same value, this puzzle is impossible to solve.
        return [Result.NOT_SOLVABLE, 0];
      }
    }

    // All hints must be respected
    for (let i = 0; i < p.n; ++i) {
      const row = p.marksRow(i);
      if (row.every(cell => cell.size == 1)) {
        // If this row is fully solved, check if it respects the hints.
        const solvedRow = row.map(cell => cell.values().next().value);
        if (view(solvedRow) != p.wHints[i]) {
          return [Result.NOT_SOLVABLE, 0];
        }
        if (view(solvedRow.reverse()) != p.eHints[i]) {
          return [Result.NOT_SOLVABLE, 0];
        }
      }
      const column = p.marksColumn(i);
      if (column.every(cell => cell.size == 1)) {
        // If this column is fully solved, check if it respects the hints.
        const solvedColumn = column.map(cell => cell.values().next().value);
        if (view(solvedColumn) != p.nHints[i]) {
          return [Result.NOT_SOLVABLE, 0];
        }
        if (view(solvedColumn.reverse()) != p.sHints[i]) {
          return [Result.NOT_SOLVABLE, 0];
        }
      }
    }

    // If the puzzle is now fully solved return 0.
    if (p.marks.every(column => column.every(cell => cell.size == 1))) {
      return [Result.SOLVABLE, 0];
    }

    // Otherwise, time to do trial and error.
    let minDepth = Number.MAX_SAFE_INTEGER;
    let nextRemoval: [number, number, number]|null = null;
    if (maxDepth > 0) {
      for (let x = iterationInfo[0]; x < p.n; x++) {
        for (let y = iterationInfo[1]; y < p.n; y++) {
          const cell = p.marks[x][y];
          if (cell.size > 1) {
            cell.forEach(possibility => {
              if (possibility >= iterationInfo[2] && minDepth > maxDepth) {
                const c = p.copy();
                c.marks[x][y] = new Set([possibility]);
                this.simpleLatinSolve(c, [y], [x]);
                try {
                  this.viewAnalysisSolve(c);
                } catch (e) {
                  
                }
                const [solvable, depth] = this.depthSolve(c, Math.min(minDepth, maxDepth - 1), [x, y, possibility]);
                if (solvable == Result.NOT_SOLVABLE) {
                  if (depth < minDepth) {
                    minDepth = depth;
                    nextRemoval = [x, y, possibility];
                  }
                }
              }
            });
          }
        }
      }
    }

    if (nextRemoval) {
      // We can make progress!
      p.marks[nextRemoval[0]][nextRemoval[1]].delete(nextRemoval[2]);
      // Can we solve further?
      const result = this.depthSolve(p, maxDepth);
      return [result[0], Math.max(minDepth + 1, result[1])]
    } else {
      // Can't make any more progress with the given depth limit, as far as we know, this is possibly
      // solvable.
      return [Result.UNKONWN, 0];
    }
  }
}
