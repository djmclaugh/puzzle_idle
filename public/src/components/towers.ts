import Vue from '../vue.js'
import LatinSquareCellComponent from './latin_square_cell.js'
import TowersHintCellComponent from './towers_hint_cell.js'
import Towers from '../puzzles/towers/towers.js'
import MultiKeyMap from '../util/multi_key_map.js'

export enum TowersGridSize {
  SMALL,
  REGULAR,
}

export interface Background {
  cell: [number, number],
  colour: string,
}

interface TowersComponentProps {
  puzzle: Towers,
  interactive: boolean,
  size?: TowersGridSize,
  backgrounds?: Background[],
}

export default {
  props: ['puzzle', 'interactive', 'size', 'backgrounds'],

  setup(props: TowersComponentProps) {

    function size() {
      return props.size ? props.size : TowersGridSize.REGULAR;
    }

    return () => {
      const backgroundMaps: MultiKeyMap<number, number, string> = new MultiKeyMap();
      for (const background of props.backgrounds || []) {
        backgroundMaps.set(background.cell[0], background.cell[1], background.colour);
      }

      const items = [];
      const puzzle = props.puzzle;
      const n = puzzle.n;

      // Empty top left corner
      items.push(Vue.h('div'))
      for (let i = 0; i < n; ++i) {
        items.push(Vue.h(TowersHintCellComponent, {
          value: puzzle.nHints[i],
          marked: puzzle.northHintMarked[i],
          onClick: () => {
            puzzle.northHintMarked[i] = !puzzle.northHintMarked[i];
          },
        }));
      }
      // Empty top rigth corner
      items.push(Vue.h('div'))

      for (let i = 0; i < n * n; ++i) {
        const x = i % n;
        const y = Math.floor(i / n);
        if (x == 0) {
          items.push(Vue.h(TowersHintCellComponent, {
            value: puzzle.wHints[y],
            marked: puzzle.westHintMarked[y],
            onClick: () => {
              puzzle.westHintMarked[y] = !puzzle.westHintMarked[y];
            },
          }));
        }
        const style: any = {
          'border-left': (x == 0 ? 2 : 1) + 'px solid',
          'border-right': (x == n - 1 ? 2 : 1) + 'px solid',
          'border-top': (y == 0 ? 2 : 1) + 'px solid',
          'border-bottom': (y == n - 1 ? 2 : 1) + 'px solid',
        };
        if (backgroundMaps.has(x, y)) {
          style['background-color'] = backgroundMaps.get(x, y);
        } else if (puzzle.grid[y][x] != -1) {
          style['background-color'] = "#dddddd";
        }

        const canEdit = props.interactive && puzzle.grid[y][x] == -1;

        const cell = Vue.h(LatinSquareCellComponent, {
          possibilities: puzzle.marksCell(y, x),
          range: canEdit ? n : -1,
          style: style,
          onAdd: (value: number) => { puzzle.addToCell(y, x, value); },
          onRemove: (value: number) => { puzzle.removeFromCell(y, x, value); },
          onSet: (value: number) => { puzzle.setCell(y, x, value); },
        });
        items.push(cell);
        if (x == n - 1) {
          items.push(Vue.h(TowersHintCellComponent, {
            value: puzzle.eHints[y],
            marked: puzzle.eastHintMarked[y],
            onClick: () => {
              puzzle.eastHintMarked[y] = !puzzle.eastHintMarked[y];
            },
          }));
        }
      }

      // Empty bottom left corner
      items.push(Vue.h('div'))
      for (let i = 0; i < n; ++i) {
        items.push(Vue.h(TowersHintCellComponent, {
          value: puzzle.sHints[i],
          marked: puzzle.southHintMarked[i],
          onClick: () => {
            puzzle.southHintMarked[i] = !puzzle.southHintMarked[i];
          },
        }));
      }
      // Empty bottom rigth corner
      items.push(Vue.h('div'))

      return Vue.h('div', {
        class: ['towers-grid', 'towers-grid-'+n],
      }, items);
    };

  }
}
