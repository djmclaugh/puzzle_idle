import LatinSquare from '../../src/puzzles/latin_square.js';

export function run() {
  console.log("Test Latin Squares: ")

  console.log('To string from string should give back same thing: ')
  const square = LatinSquare.randomOfSize(3);
  console.log('To String:');
  console.log(square.toString());
  console.log('To String -> From String -> To String:');
  console.log(LatinSquare.fromString(square.toString()).toString());
  console.log('Pass?: ' + (square.toString() == LatinSquare.fromString(square.toString()).toString()));
}
