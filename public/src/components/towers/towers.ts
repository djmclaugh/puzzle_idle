import Vue from '../../vue.js'
import LatinSquareCellComponent from './latin_square_cell.js'
import TowersHintCellComponent from './towers_hint_cell.js'
import { Triple } from '../../puzzles/towers/triple_collection.js'
import Towers, { HintFace } from '../../puzzles/towers/towers.js'
import { DoubleKeyMap } from '../../util/multi_key_map.js'

export interface Background {
  cell: [number, number],
  colour: string,
}

interface TowersComponentProps {
  puzzle: Towers,
  interactive: boolean,
  backgrounds?: Background[],
}

interface TowersComponentData {
  hoveredValue: Triple|null,
  implicationSource: Triple|null,
  implicationSourceNegated: boolean,
}

export default {
  props: ['puzzle', 'interactive', 'size', 'backgrounds'],

  setup(props: TowersComponentProps) {

    const data: TowersComponentData = Vue.reactive({
      hoveredValue: null,
      implicationSource: null,
      implicationSourceNegated: false,
    })

    return () => {
      const backgroundMaps: DoubleKeyMap<number, number, string> = new DoubleKeyMap();
      for (const background of props.backgrounds || []) {
        backgroundMaps.set(background.cell[0], background.cell[1], background.colour);
      }

      const items = [];
      const puzzle = props.puzzle;
      const n = puzzle.n;

      let onImplications: DoubleKeyMap<number, number, number[]> = new DoubleKeyMap();
      let offImplications: DoubleKeyMap<number, number, number[]> = new DoubleKeyMap();
      if (data.hoveredValue) {
        const [on, off] = props.puzzle.implications.getImplicationsFromNodeSet(data.hoveredValue);
        for (const t of on) {
          if (!onImplications.has(t.row, t.col)) {
            onImplications.set(t.row, t.col, []);
          }
          onImplications.get(t.row, t.col)!.push(t.val);
        }
        for (const t of off) {
          if (!offImplications.has(t.row, t.col)) {
            offImplications.set(t.row, t.col, []);
          }
          offImplications.get(t.row, t.col)!.push(t.val);
        }
      }

      // Empty top left corner
      items.push(Vue.h('div'))
      for (let i = 0; i < n; ++i) {
        items.push(Vue.h(TowersHintCellComponent, {
          value: puzzle.getHints(HintFace.NORTH)[i],
          marked: puzzle.northHintMarked[i],
          onClick: () => {
            puzzle.toggleHint(HintFace.NORTH, i);
          },
        }));
      }
      // Empty top rigth corner
      items.push(Vue.h('div'))

      for (let i = 0; i < n * n; ++i) {
        const x = i % n;
        const y = Math.floor(i / n);

        const highlight = {
          red: new Set(offImplications.get(y, x) || []),
          yellow: new Set(),
          green: new Set(onImplications.get(y, x) || []),
        }
        if (data.hoveredValue !== null) {
          highlight.yellow.add(data.hoveredValue.val);
        }

        if (x == 0) {
          items.push(Vue.h(TowersHintCellComponent, {
            value: puzzle.getHints(HintFace.WEST)[y],
            marked: puzzle.westHintMarked[y],
            onClick: () => {
              puzzle.toggleHint(HintFace.WEST, y);
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
          highlight: highlight,
          style: style,
          onAdd: (value: number) => { puzzle.addToCell(y, x, value); },
          onRemove: (value: number) => {
            puzzle.removeFromCell(y, x, value);
            data.hoveredValue = null;
          },
          onGuess: (value: number) => { puzzle.takeGuess({row: y, col: x, val: value}); },
          onSet: (value: number) => {
            if (data.implicationSource === null) {
              puzzle.setCell(y, x, value);
            } else {
              data.implicationSource = null;
            }
          },
          onImplication: ([value, negated]: [number, boolean]) => {
            if (data.implicationSource === null) {
              data.implicationSource = {
                row: y,
                col: x,
                val: value,
              };
              data.implicationSourceNegated = negated;
            } else {
              if (!data.implicationSourceNegated && !negated) {
                puzzle.addImplication(data.implicationSource, {
                  row: y,
                  col: x,
                  val: value,
                });
              }
              if (data.implicationSourceNegated && negated) {
                puzzle.addImplication({
                  row: y,
                  col: x,
                  val: value,
                }, data.implicationSource);
              }
              if (!data.implicationSourceNegated && negated) {
                puzzle.addOnToOffImplication(data.implicationSource, {
                  row: y,
                  col: x,
                  val: value,
                });
              }
              if (data.implicationSourceNegated && !negated) {
                puzzle.addOffToOnImplication(data.implicationSource, {
                  row: y,
                  col: x,
                  val: value,
                });
              }

              data.implicationSource = null;
            }
          },
          onUpdateHighlight: (value: number|undefined) => {
            if (value === undefined) {
              data.hoveredValue = null;
            } else {
              data.hoveredValue = {row: y, col: x, val: value};
            }
          }
        });
        items.push(cell);
        if (x == n - 1) {
          items.push(Vue.h(TowersHintCellComponent, {
            value: puzzle.getHints(HintFace.EAST)[y],
            marked: puzzle.eastHintMarked[y],
            onClick: () => {
              puzzle.toggleHint(HintFace.EAST, y);
            },
          }));
        }
      }

      // Empty bottom left corner
      items.push(Vue.h('div'))
      for (let i = 0; i < n; ++i) {
        items.push(Vue.h(TowersHintCellComponent, {
          value: puzzle.getHints(HintFace.SOUTH)[i],
          marked: puzzle.southHintMarked[i],
          onClick: () => {
            puzzle.toggleHint(HintFace.SOUTH, i);
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
