import Vue from '../vue.js'
import LatinSquareCellComponent from './latin_square_cell.js'
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

  setup(props: TowersComponentProps): any {

    const puzzle = props.puzzle;
    const n = puzzle.n;

    function size() {
      return props.size ? props.size : TowersGridSize.REGULAR;
    }

    return () => {
      const backgroundMaps: MultiKeyMap<number, number, string> = new MultiKeyMap();
      for (const background of props.backgrounds || []) {
        backgroundMaps.set(background.cell[0], background.cell[1], background.colour);
      }

      const puzzle = props.puzzle;
      const n = puzzle.n;
      const items = [];

      // Empty top left corner
      items.push(Vue.h('div'))
      for (let i = 0; i < n; ++i) {
        items.push(Vue.h('div', {
          class: 'towers-hint',
        }, puzzle.nHints[i] == -1 ? "" : puzzle.nHints[i]));
      }
      // Empty top rigth corner
      items.push(Vue.h('div'))

      for (let i = 0; i < n * n; ++i) {
        const x = i % n;
        const y = Math.floor(i / n);
        if (x == 0) {
          items.push(Vue.h('div', {
            class: 'towers-hint',
          }, puzzle.wHints[y] == -1 ? "" : puzzle.wHints[y]));
        }
        const style: any = {
          'border-left': (x == 0 ? 2 : 1) + 'px solid',
          'border-right': (x == n - 1 ? 2 : 1) + 'px solid',
          'border-top': (y == 0 ? 2 : 1) + 'px solid',
          'border-bottom': (y == n - 1 ? 2 : 1) + 'px solid',
        };
        if (backgroundMaps.has(x, y)) {
          style['background-color'] = backgroundMaps.get(x, y);
        }

        const cell = Vue.h(LatinSquareCellComponent, {
          possibilities: puzzle.marks[i % n ][Math.floor(i / n)],
          range: props.interactive ? n : -1,
          style: style,
        });
        items.push(cell);
        if (x == n - 1) {
          items.push(Vue.h('div', {
            class: 'towers-hint'
          }, puzzle.eHints[y] == -1 ? "" : puzzle.eHints[y]));
        }
      }

      // Empty bottom left corner
      items.push(Vue.h('div'))
      for (let i = 0; i < n; ++i) {
        items.push(Vue.h('div', {
          class: 'towers-hint'
        }, puzzle.sHints[i] == -1 ? "" : puzzle.sHints[i]));
      }
      // Empty bottom rigth corner
      items.push(Vue.h('div'))

      return Vue.h('div', {
        class: ['towers-grid', 'towers-grid-'+n],
      }, items);
    };

  }
}
