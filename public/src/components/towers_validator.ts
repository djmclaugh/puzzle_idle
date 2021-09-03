import Vue from '../vue.js'
import LatinSquareCellComponent from './latin_square_cell.js'
import TowersComponent, { TowersGridSize, Background } from './towers.js'
import Towers from '../puzzles/towers/towers.js'
import { HintFace } from '../puzzles/towers/towers.js'

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

function faceToString(face: HintFace) {
  switch(face) {
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

function isVertical(face: HintFace) {
  switch(face) {
    case HintFace.WEST:
    case HintFace.EAST:
      return false;
    case HintFace.NORTH:
    case HintFace.SOUTH:
      return true;
  }
}

function isReverse(face: HintFace) {
  switch(face) {
    case HintFace.SOUTH:
    case HintFace.EAST:
      return true;
    case HintFace.WEST:
    case HintFace.NORTH:
      return false;
  }
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
    const data: ValidationState = Vue.reactive({
      step: ValidationStep.ROW,
      latinCheck: {
        row: 0,
        index1: 0,
        index2: 1,
        beat: 0,
      },
      hintCheck: {
        face: HintFace.WEST,
        index: 0,
        seenSoFar: [],
        indexSoFar: 0,
        beat: 0,
      },
    })

    function canBeSeen(seenSoFar: number[], x: number): boolean {
      return seenSoFar.length == 0 || seenSoFar[seenSoFar.length - 1] < x;
    }

    // Modifies the validation state to the next step
    // Returns if the process can go on or not.
    function nextStep(): boolean {
      if (data.step == ValidationStep.DONE) {
        return false;
      }
      if (data.step == ValidationStep.ROW || data.step == ValidationStep.COLUMN) {
        const s = data.latinCheck;
        if (s.beat == 1) {
          if (data.step == ValidationStep.ROW) {
            if (solution[s.row][s.index1] == solution[s.row][s.index2]) {
              return false;
            }
          } else if (data.step == ValidationStep.COLUMN) {
            if (solution[s.index1][s.row] == solution[s.index2][s.row]) {
              return false;
            }
          }
          s.index2 += 1;
          if (s.index2 >= n) {
            s.index1 += 1;
            s.index2 = s.index1 + 1;
          }
          if (s.index1 == n - 1) {
            s.index1 = 0;
            s.index2 = 1;
            s.row +=1;
          }
          if (s.row == n) {
            s.row = 0;
            data.step += 1;
            if (data.step == ValidationStep.HINTS) {
              const hintS = data.hintCheck;
              while(data.step != ValidationStep.DONE && getHints(puzzle, hintS.face)[hintS.index] == -1) {
                hintS.index += 1
                if (hintS.index == n) {
                  hintS.index = 0;
                  hintS.face += 1;
                }
                if (hintS.face > HintFace.SOUTH) {
                  hintS.face = 0;
                  data.step += 1;
                }
              }
            }
          }
        }
        s.beat = 1 - s.beat;
        return true;
      } else if (data.step == ValidationStep.HINTS) {
        const s = data.hintCheck;
        if (s.beat == 1) {
          if (s.indexSoFar < n) {
            const isV = isVertical(s.face);
            const isR = isReverse(s.face);
            const x = isV ? s.index : (isR ? n - s.indexSoFar - 1 : s.indexSoFar);
            const y = isV ? (isR ? n - s.indexSoFar - 1 : s.indexSoFar) : s.index;

            const current = solution[y][x];
            if (canBeSeen(s.seenSoFar.map(a => a.value), current)) {
              s.seenSoFar.push({
                x: x,
                y: y,
                value: current,
              });
            }
            s.indexSoFar += 1;
          } else {
            let hints = getHints(puzzle, s.face);
            if (hints[s.index] != s.seenSoFar.length) {
              return false;
            }
            s.indexSoFar = 0;
            s.index += 1
            s.seenSoFar = [];
            if (s.index == n) {
              s.index = 0;
              s.face += 1;
            }
            if (s.face > HintFace.SOUTH) {
              s.face = 0;
              data.step += 1;
            }
            while(data.step != ValidationStep.DONE && getHints(puzzle, s.face)[s.index] == -1) {
              s.index += 1
              if (s.index == n) {
                s.index = 0;
                s.face += 1;
              }
              if (s.face > HintFace.SOUTH) {
                s.face = 0;
                data.step += 1;
              }
            }
          }
        }
        s.beat = 1 - s.beat;
        return data.step != ValidationStep.DONE;
      }
      throw new Error("This should never happen");
    }

    function loop() {
      setTimeout(() => {
        if (nextStep()) {
          loop();
        } else {
          emit('done', data.step == ValidationStep.DONE);
        }
      }, 1000 / props.speed);
    }
    loop();

    return () => {
      const items = [];
      const backgrounds = [];

      if (data.step == ValidationStep.ROW) {
        items.push(Vue.h('p', {}, `Checking that no row has duplicates...`));
        for (let i = 0; i < data.latinCheck.row; ++i) {
          items.push(Vue.h('p', {}, `- Row ${i + 1}: ✔️`));
        }
        items.push(Vue.h('p', {}, `- Checking Row ${data.latinCheck.row + 1}...`));
        const y = data.latinCheck.row;
        const x1 = data.latinCheck.index1;
        const x2 = data.latinCheck.index2;
        let message = `-- Is ${solution[y][x1] + 1} different from ${solution[y][x2] + 1}?`;
        let colour = '#ffffc0f0';

        if (data.latinCheck.beat == 1) {
          if (solution[y][x1] == solution[y][x2]) {
            message += ' No ❌';
            colour = '#ffc0c0f0';
          } else {
            message += ' Yes ✔️';
            colour = '#c0ffc0f0';
          }
        }

        items.push(Vue.h('p', {}, message));
        backgrounds.push({
          cell: [x1, y],
          colour: colour,
        });
        backgrounds.push({
          cell: [x2, y],
          colour: colour,
        });
      } else if (data.step > ValidationStep.ROW) {
        items.push(Vue.h('p', {}, `Checking that no row has duplicates: ✔️`));
      }

      if (data.step == ValidationStep.COLUMN) {
        items.push(Vue.h('p', {}, `Checking that no column has duplicates...`));
        for (let i = 0; i < data.latinCheck.row; ++i) {
          items.push(Vue.h('p', {}, `- Column ${i + 1}: ✔️`));
        }
        items.push(Vue.h('p', {}, `- Checking Column ${data.latinCheck.row + 1}...`));
        const x = data.latinCheck.row;
        const y1 = data.latinCheck.index1;
        const y2 = data.latinCheck.index2;
        let message = `-- Is ${solution[y1][x] + 1} different from ${solution[y2][x] + 1}?`;
        let colour = '#ffffc0f0';

        if (data.latinCheck.beat == 1) {
          if (solution[y1][x] == solution[y2][x]) {
            message += ' No ❌';
            colour = '#ffc0c0f0';
          } else {
            message += ' Yes ✔️';
            colour = '#c0ffc0f0';
          }
        }

        items.push(Vue.h('p', {}, message));
        backgrounds.push({
          cell: [x, y1],
          colour: colour,
        });
        backgrounds.push({
          cell: [x, y2],
          colour: colour,
        });
      } else if (data.step > ValidationStep.COLUMN) {
        items.push(Vue.h('p', {}, `Checking that no column has duplicates: ✔️`));
      }

      if (data.step == ValidationStep.HINTS) {
        items.push(Vue.h('p', {}, `Checking visibility hints...`));
        const s = data.hintCheck
        for (let i = HintFace.WEST; i < s.face; ++i) {
          items.push(Vue.h('p', {}, `- ${faceToString(i)} face: ✔️`));
        }

        items.push(Vue.h('p', {}, `- Checking ${faceToString(s.face)} face...`));

        const isV = isVertical(s.face);
        for (let i = 0; i < s.index; ++i) {
          items.push(Vue.h('p', {}, `-- ${isV ? 'Column' : 'Row'} ${i + 1}: ✔️`));
        }
        items.push(Vue.h('p', {}, `-- Checking ${isV ? 'column' : 'row'} ${s.index + 1}...`));
        if (s.indexSoFar < n) {
          const isR = isReverse(s.face);
          const x = isV ? s.index : (isR ? n - s.indexSoFar - 1 : s.indexSoFar);
          const y = isV ? (isR ? n - s.indexSoFar - 1 : s.indexSoFar) : s.index;
          let message = `--- Can the ${solution[y][x] + 1} tower be seen?`;
          let colour = '#ffffc0f0';
          if (s.beat == 1) {
            if (canBeSeen(s.seenSoFar.map(a => a.value), solution[y][x])) {
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
          s.seenSoFar.forEach(seen => {
            backgrounds.push({
              cell: [seen.x, seen.y],
              colour: '#c0ffc0f0',
            })
          })
        } else {
          let hints: number[] = getHints(puzzle, s.face);
          let message = `--- Can exactly ${hints[s.index]} tower(s) be seen?`;
          let colour = '#ffffc0f0';
          if (s.beat == 1) {
            if (s.seenSoFar.length == hints[s.index]) {
              message += " Yes ✔️";
              colour = '#c0ffc0f0';
            } else {
              message += ` No ❌ (${s.seenSoFar.length} tower(s) can be seen)`;
              colour = '#ffc0c0f0';
            }
          }
          items.push(Vue.h('p', {}, message));
          s.seenSoFar.forEach(seen => {
            backgrounds.push({
              cell: [seen.x, seen.y],
              colour: colour,
            })
          })
        }
      } else if (data.step > ValidationStep.HINTS) {
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
