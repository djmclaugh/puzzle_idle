import { viewAnalysisSolve } from '../../../src/puzzles/solvers/view_analysis.js'
import { Possibilities } from '../../../src/puzzles/towers.js'

function assert(b: boolean) {
  if (!b) {
    throw new Error();
  }
}

export function runTest() {
  let row = [
    new Set([0, 1]),
    new Set([0, 1, 2, 3, 4]),
    new Set([0, 1, 2, 3, 4]),
    new Set([0, 1, 2, 3, 4]),
    new Set([5]),
    new Set([0, 1, 2, 3]),
  ];

  let result = viewAnalysisSolve(3, row);

  assert(row[0].has(0));
  assert(row[0].has(1));

  assert(row[1].has(0));
  assert(!row[1].has(1));
  assert(!row[1].has(2));
  assert(!row[1].has(3));
  assert(row[1].has(4));

  assert(row[2].has(0));
  assert(row[2].has(1));
  assert(row[2].has(2));
  assert(row[2].has(3));
  assert(row[2].has(4));

  assert(row[3].has(0));
  assert(row[3].has(1));
  assert(row[3].has(2));
  assert(row[3].has(3));

  assert(row[4].has(5));

  assert(row[5].has(0));
  assert(row[5].has(1));
  assert(row[5].has(2));
  assert(row[5].has(3));

  assert(!result.foundCountradiction);
  assert(result.indicesModified.length == 1);
  assert(result.indicesModified[0] == 1);

  row = [
    new Set([0, 1, 2, 3, 4]),
    new Set([0, 1, 2, 3, 4]),
    new Set([0, 1, 2, 3, 4]),
    new Set([0, 1, 2, 3, 4]),
    new Set([0, 1, 2, 3, 4]),
    new Set([5]),
  ];

  result = viewAnalysisSolve(2, row);

  assert(!row[0].has(0));
  assert(!row[0].has(1));
  assert(!row[0].has(2));
  assert(!row[0].has(3));
  assert(row[0].has(4));

  assert(row[1].has(0));
  assert(row[1].has(1));
  assert(row[1].has(2));
  assert(row[1].has(3));
  assert(row[1].has(4));

  assert(row[2].has(0));
  assert(row[2].has(1));
  assert(row[2].has(2));
  assert(row[2].has(3));
  assert(row[2].has(4));

  assert(row[3].has(0));
  assert(row[3].has(1));
  assert(row[3].has(2));
  assert(row[3].has(3));
  assert(row[3].has(4));

  assert(row[4].has(0));
  assert(row[4].has(1));
  assert(row[4].has(2));
  assert(row[4].has(3));
  assert(row[4].has(4));

  assert(row[5].has(5));

  assert(!result.foundCountradiction);
  assert(result.indicesModified.length == 1);
  assert(result.indicesModified[0] == 0);
}
