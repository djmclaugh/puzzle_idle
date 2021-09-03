import Towers from '../../src/puzzles/towers/towers.js';

export function run() {
  console.log("Test Towers: ")

  const towers = new Towers([[-1, -1, -1], [-1, -1, -1], [-1, -1, -1]], [1, -1, -1], [-1, 2, -1], [3, -1, -1], [-1, -1, -1]);
  console.log(towers.toString());
}
