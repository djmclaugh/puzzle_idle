import Vue from '../vue.js'
import LatinSquareCellComponent from './latin_square_cell.js'
import TowersComponent, { TowersGridSize, Background } from './towers.js'
import Towers from '../puzzles/towers/towers.js'
import { HintFace, isVertical, getCoordinates, faceToString, isClockwise } from '../puzzles/towers/towers.js'
import { ValidationProcess } from '../data/process.js'

interface TowersValidatorComponentProps {
  puzzle: Towers,
  speed: number,
}

interface ValidationState {
  step: ValidationStep,
  latinCheck: {
    row: number,
    index1: number,
    index2: number,
    beat: number,
  },
  hintCheck: {
    face: HintFace,
    index: number,
    seenSoFar: {
      x: number,
      y: number,
      value: number
    }[],
    indexSoFar: number,
    beat: number,
  },
}

enum ValidationStep {
  ROW = 1,
  COLUMN = 2,
  HINTS = 3,
  DONE = 4,
}

function getHints(puzzle: Towers, face: HintFace): number[] {
  if (face == HintFace.WEST) {
    return puzzle.wHints;
  } else if (face == HintFace.NORTH) {
    return puzzle.nHints;
  } else if (face == HintFace.EAST) {
    return puzzle.eHints;
  } else if (face == HintFace.SOUTH) {
    return puzzle.sHints;
  }
  throw Error("This should never happen");
}

export default {
  props: ['puzzle', 'speed'],

  setup(props: TowersValidatorComponentProps, {slots, attrs, emit}: any): any {

    const puzzle = props.puzzle;
    const n = puzzle.n;
    const solution = puzzle.marks.map(row => row.map(cell => cell.values().next().value));
    // const data: ValidationState = Vue.reactive({
    //   step: ValidationStep.ROW,
    //   latinCheck: {
    //     row: 0,
    //     index1: 0,
    //     index2: 1,
    //     beat: 0,
    //   },
    //   hintCheck: {
    //     face: HintFace.WEST,
    //     index: 0,
    //     seenSoFar: [],
    //     indexSoFar: 0,
    //     beat: 0,
    //   },
    // })

    const process: ValidationProcess = Vue.reactive(new ValidationProcess(props.puzzle))
    process.tick();

    // Modifies the validation state to the next step
    // Returns if the process can go on or not.
    function nextStep(): boolean {
      // if (data.step == ValidationStep.DONE) {
      //   return false;
      // }
      // if (data.step == ValidationStep.ROW || data.step == ValidationStep.COLUMN) {
      //   const s = data.latinCheck;
      //   if (s.beat == 1) {
      //     if (data.step == ValidationStep.ROW) {
      //       if (solution[s.row][s.index1] == solution[s.row][s.index2]) {
      //         return false;
      //       }
      //     } else if (data.step == ValidationStep.COLUMN) {
      //       if (solution[s.index1][s.row] == solution[s.index2][s.row]) {
      //         return false;
      //       }
      //     }
      //     s.index2 += 1;
      //     if (s.index2 >= n) {
      //       s.index1 += 1;
      //       s.index2 = s.index1 + 1;
      //     }
      //     if (s.index1 == n - 1) {
      //       s.index1 = 0;
      //       s.index2 = 1;
      //       s.row +=1;
      //     }
      //     if (s.row == n) {
      //       s.row = 0;
      //       data.step += 1;
      //       if (data.step == ValidationStep.HINTS) {
      //         const hintS = data.hintCheck;
      //         while(data.step != ValidationStep.DONE && getHints(puzzle, hintS.face)[hintS.index] == -1) {
      //           hintS.index += 1
      //           if (hintS.index == n) {
      //             hintS.index = 0;
      //             hintS.face += 1;
      //           }
      //           if (hintS.face > HintFace.SOUTH) {
      //             hintS.face = 0;
      //             data.step += 1;
      //           }
      //         }
      //       }
      //     }
      //   }
      //   s.beat = 1 - s.beat;
      //   return true;
      // } else if (data.step == ValidationStep.HINTS) {
      //   const s = data.hintCheck;
      //   if (s.beat == 1) {
      //     if (s.indexSoFar < n) {
      //       const isV = isVertical(s.face);
      //       const isR = isReverse(s.face);
      //       const x = isV ? s.index : (isR ? n - s.indexSoFar - 1 : s.indexSoFar);
      //       const y = isV ? (isR ? n - s.indexSoFar - 1 : s.indexSoFar) : s.index;
      //
      //       const current = solution[y][x];
      //       if (canBeSeen(s.seenSoFar.map(a => a.value), current)) {
      //         s.seenSoFar.push({
      //           x: x,
      //           y: y,
      //           value: current,
      //         });
      //       }
      //       s.indexSoFar += 1;
      //     } else {
      //       let hints = getHints(puzzle, s.face);
      //       if (hints[s.index] != s.seenSoFar.length) {
      //         return false;
      //       }
      //       s.indexSoFar = 0;
      //       s.index += 1
      //       s.seenSoFar = [];
      //       if (s.index == n) {
      //         s.index = 0;
      //         s.face += 1;
      //       }
      //       if (s.face > HintFace.SOUTH) {
      //         s.face = 0;
      //         data.step += 1;
      //       }
      //       while(data.step != ValidationStep.DONE && getHints(puzzle, s.face)[s.index] == -1) {
      //         s.index += 1
      //         if (s.index == n) {
      //           s.index = 0;
      //           s.face += 1;
      //         }
      //         if (s.face > HintFace.SOUTH) {
      //           s.face = 0;
      //           data.step += 1;
      //         }
      //       }
      //     }
      //   }
      //   s.beat = 1 - s.beat;
      //   return data.step != ValidationStep.DONE;
      // }
      // throw new Error("This should never happen");
      return !process.tick();
    }

    let stopLoop = false;

    function loop() {
      if (stopLoop) {
        return;
      }
      setTimeout(() => {
        if (nextStep()) {
          loop();
        } else {
          emit('done', process.step == ValidationStep.DONE);
        }
      }, 1000 / props.speed);
    }

    Vue.onMounted(() => {
      loop();
    })

    Vue.onBeforeUnmount(() => {
      stopLoop = true;
    })

    return () => {
      const items = [];
      const backgrounds = [];

      if (process.step == ValidationStep.ROW) {
        const row = process.index1;
        const a = process.index2;
        const b = process.index3;
        items.push(Vue.h('p', {}, `Checking that no row has duplicates...`));
        for (let i = 0; i < row; ++i) {
          items.push(Vue.h('p', {}, `- Row ${i + 1}: ✔️`));
        }
        items.push(Vue.h('p', {}, `- Checking Row ${row + 1}...`));
        let message = `-- Is ${solution[row][a] + 1} different from ${solution[row][b] + 1}?`;
        let colour = '#ffffc0f0';

        if (process.beat == 1) {
          if (solution[row][a] == solution[row][b]) {
            message += ' No ❌';
            colour = '#ffc0c0f0';
          } else {
            message += ' Yes ✔️';
            colour = '#c0ffc0f0';
          }
        }

        items.push(Vue.h('p', {}, message));
        backgrounds.push({
          cell: [a, row],
          colour: colour,
        });
        backgrounds.push({
          cell: [b, row],
          colour: colour,
        });
      } else if (process.step > ValidationStep.ROW) {
        items.push(Vue.h('p', {}, `Checking that no row has duplicates: ✔️`));
      }

      if (process.step == ValidationStep.COLUMN) {
        const column = process.index1;
        const a = process.index2;
        const b = process.index3;
        items.push(Vue.h('p', {}, `Checking that no column has duplicates...`));
        for (let i = 0; i < column; ++i) {
          items.push(Vue.h('p', {}, `- Column ${i + 1}: ✔️`));
        }
        items.push(Vue.h('p', {}, `- Checking Column ${column + 1}...`));
        let message = `-- Is ${solution[a][column] + 1} different from ${solution[b][column] + 1}?`;
        let colour = '#ffffc0f0';

        if (process.beat == 1) {
          if (solution[a][column] == solution[b][column]) {
            message += ' No ❌';
            colour = '#ffc0c0f0';
          } else {
            message += ' Yes ✔️';
            colour = '#c0ffc0f0';
          }
        }

        items.push(Vue.h('p', {}, message));
        backgrounds.push({
          cell: [column, a],
          colour: colour,
        });
        backgrounds.push({
          cell: [column, b],
          colour: colour,
        });
      } else if (process.step > ValidationStep.COLUMN) {
        items.push(Vue.h('p', {}, `Checking that no column has duplicates: ✔️`));
      }

      if (process.step == ValidationStep.HINTS) {
        items.push(Vue.h('p', {}, `Checking visibility hints...`));
        const face: HintFace = process.index1;
        const hintIndex = process.index2;
        const rowIndex = process.index3;
        const hints = props.puzzle.getHints(face);
        if (!isClockwise(face)) {
          hints.reverse()
        }

        items.push(Vue.h('p', {}, `- Checking ${faceToString(face)} face...`));

        const isV = isVertical(face);
        for (let i = 0; i < hintIndex; ++i) {
          items.push(Vue.h('p', {}, `-- ${isV ? 'Column' : 'Row'} ${i + 1}: ✔️`));
        }
        items.push(Vue.h('p', {}, `-- Checking ${isV ? 'column' : 'row'} ${hintIndex + 1}...`));
        if (rowIndex < n) {
          const [x, y] = getCoordinates(face, hintIndex, rowIndex, n);
          let message = `--- Can the ${solution[y][x] + 1} tower be seen?`;
          let colour = '#ffffc0f0';
          if (process.beat == 1) {
            if (hints[hintIndex] == -1) {
              message += ' Doesn\'t matter, no hints to satisfy.';
            } else if (process.seenSoFar.indexOf(rowIndex) != -1) {
              message += ' Yes';
              colour = '#c0ffc0f0';
            } else {
              message += ' No';
              colour = '#c0c0a0f0';
            }
          }
          items.push(Vue.h('p', {}, message));
          backgrounds.push({
            cell: [x, y],
            colour: colour,
          });
          process.seenSoFar.forEach(seen => {
            const [sX, sY] = getCoordinates(face, hintIndex, seen, n);
            backgrounds.push({
              cell: [sX, sY],
              colour: '#c0ffc0f0',
            })
          })
        } else {
          let message = `--- Can exactly ${hints[hintIndex]} tower(s) be seen?`;
          let colour = '#ffffc0f0';
          if (process.beat == 1) {
            if (process.seenSoFar.length == hints[hintIndex]) {
              message += " Yes ✔️";
              colour = '#c0ffc0f0';
            } else {
              message += ` No ❌ (${process.seenSoFar.length} tower(s) can be seen)`;
              colour = '#ffc0c0f0';
            }
          }
          items.push(Vue.h('p', {}, message));
          process.seenSoFar.forEach(seen => {
            const [sX, sY] = getCoordinates(face, hintIndex, seen, n);
            backgrounds.push({
              cell: [sX, sY],
              colour: colour,
            })
          })
        }
      } else if (process.step > ValidationStep.HINTS) {
        items.push(Vue.h('p', {}, `Checking visibility hints: ✔️`));
      }

      items.unshift(Vue.h(TowersComponent, {
        puzzle: props.puzzle,
        interactive: false,
        size: TowersGridSize.SMALL,
        backgrounds:backgrounds,
      }))

      return Vue.h('div', {}, items);
    };

  }
}
