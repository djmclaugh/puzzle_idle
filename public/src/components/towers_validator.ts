import Vue from '../vue.js'
import TowersComponent, { TowersGridSize, Background } from './towers.js'
import Towers from '../puzzles/towers/towers.js'
import { HintFace, isVertical, getCoordinates, faceToString, isClockwise } from '../puzzles/towers/towers.js'
import ValidationProcess, { ValidationStep } from '../data/processes/validation_process.js'
import { currentStatus } from '../data/status.js'

interface TowersValidatorComponentProps {
  puzzle: Towers,
  interfaceId: number,
}

export default {
  props: ['puzzle', 'interfaceId'],

  setup(props: TowersValidatorComponentProps, {slots, attrs, emit}: any): any {

    const puzzle = props.puzzle;
    const n = puzzle.n;
    const solution = puzzle.solvedGrid();

    const p: ValidationProcess = Vue.reactive(new ValidationProcess(props.puzzle, props.interfaceId));

    Vue.onMounted(() => {
      currentStatus.cpu.addProcess(p, 10, (isValid: boolean) => {
        emit('done', isValid);
      });
    })

    Vue.onBeforeUnmount(() => {
      currentStatus.cpu.killProcess(p);
    })

    return () => {
      const items = [];
      const backgrounds = [];

      if (p.step == ValidationStep.ROW) {
        const row = p.index1;
        const a = p.index2;
        const b = p.index3;
        items.push(Vue.h('p', {}, `Checking that no row has duplicates...`));
        for (let i = 0; i < row; ++i) {
          items.push(Vue.h('p', {}, `- Row ${i + 1}: ✔️`));
        }
        items.push(Vue.h('p', {}, `- Checking Row ${row + 1}...`));
        let message = `-- Is ${solution[row][a] + 1} different from ${solution[row][b] + 1}?`;
        let colour = '#ffffc0f0';

        if (p.beat == 1) {
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
      } else if (p.step > ValidationStep.ROW) {
        items.push(Vue.h('p', {}, `Checking that no row has duplicates: ✔️`));
      }

      if (p.step == ValidationStep.COLUMN) {
        const column = p.index1;
        const a = p.index2;
        const b = p.index3;
        items.push(Vue.h('p', {}, `Checking that no column has duplicates...`));
        for (let i = 0; i < column; ++i) {
          items.push(Vue.h('p', {}, `- Column ${i + 1}: ✔️`));
        }
        items.push(Vue.h('p', {}, `- Checking Column ${column + 1}...`));
        let message = `-- Is ${solution[a][column] + 1} different from ${solution[b][column] + 1}?`;
        let colour = '#ffffc0f0';

        if (p.beat == 1) {
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
      } else if (p.step > ValidationStep.COLUMN) {
        items.push(Vue.h('p', {}, `Checking that no column has duplicates: ✔️`));
      }

      if (p.step == ValidationStep.HINTS) {
        items.push(Vue.h('p', {}, `Checking visibility hints...`));
        const face: HintFace = p.index1;
        const hintIndex = p.index2;
        const rowIndex = p.index3;
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
          if (p.beat == 1) {
            if (hints[hintIndex] == -1) {
              message += ' Doesn\'t matter, no hints to satisfy.';
            } else if (p.seenSoFar.indexOf(rowIndex) != -1) {
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
          p.seenSoFar.forEach(seen => {
            const [sX, sY] = getCoordinates(face, hintIndex, seen, n);
            backgrounds.push({
              cell: [sX, sY],
              colour: '#c0ffc0f0',
            })
          })
        } else {
          let message = `--- Can exactly ${hints[hintIndex]} tower(s) be seen?`;
          let colour = '#ffffc0f0';
          if (p.beat == 1) {
            if (p.seenSoFar.length == hints[hintIndex]) {
              message += " Yes ✔️";
              colour = '#c0ffc0f0';
            } else {
              message += ` No ❌ (${p.seenSoFar.length} tower(s) can be seen)`;
              colour = '#ffc0c0f0';
            }
          }
          items.push(Vue.h('p', {}, message));
          p.seenSoFar.forEach(seen => {
            const [sX, sY] = getCoordinates(face, hintIndex, seen, n);
            backgrounds.push({
              cell: [sX, sY],
              colour: colour,
            })
          })
        }
      } else if (p.step > ValidationStep.HINTS) {
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
