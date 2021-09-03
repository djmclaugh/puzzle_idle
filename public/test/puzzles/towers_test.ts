import Towers from '../../src/puzzles/towers.js';

export function run() {
  console.log("Test Towers: ")

  const towers = Towers.randomOfSize(3);
  console.log(towers.toString());
}
