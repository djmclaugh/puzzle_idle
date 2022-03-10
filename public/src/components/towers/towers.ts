import Vue from '../../vue.js'
import LatinSquareCellComponent from './latin_square_cell.js'
import TowersHintCellComponent from './towers_hint_cell.js'
import { Triple } from '../../puzzles/towers/triple_collection.js'
import Towers from '../../puzzles/towers/towers.js'
import { HintFace } from '../../puzzles/towers/hint_face.js'
import { DoubleKeyMap } from '../../util/multi_key_map.js'

import { towersUpgrades } from '../../data/towers/towers_upgrades.js'

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

    function onSet(row: number, col: number, val: number) {
      if (data.implicationSource === null) {
        props.puzzle.setCell(row, col, val);
      } else {
        data.implicationSource = null;
      }
    }

    function onRemove(row: number, col: number, val: number) {
      if (!towersUpgrades.removePossibility.isUnlocked) {
        // If the player hasn't unlocked possibility removal yet, treat control
        // clicks the same way as normal clicks.
        onSet(row, col, val);
        return;
      }
      props.puzzle.removeFromCell(row, col, val);
      data.hoveredValue = null;
    }

    function onGuess(row: number, col: number, val: number) {
      if (!towersUpgrades.guess.isUnlocked) {
        // If the player hasn't unlocked guessing yet, treat control the same
        // way as normal clicks.
        onSet(row, col, val);
        return;
      }
      props.puzzle.takeGuess({
        row: row,
        col: col,
        val: val,
      })
      data.hoveredValue = null;
    }

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
          background: backgroundMaps.get(i, -1),
          value: puzzle.getHints(HintFace.NORTH)[i],
          marked: puzzle.northHintMarked[i],
          clickable: towersUpgrades.markHintSatisfied.isUnlocked,
          onClick: () => {
            if (towersUpgrades.markHintSatisfied.isUnlocked) {
              puzzle.markHint(HintFace.NORTH, i);
            }
          },
        }));
      }
      // Empty top rigth corner
      items.push(Vue.h('div'))

      for (let i = 0; i < n * n; ++i) {
        const x = i % n;
        const y = Math.floor(i / n);

        // const highlight = {
        //   red: new Set(offImplications.get(y, x) || []),
        //   yellow: new Set(),
        //   green: new Set(onImplications.get(y, x) || []),
        // }
        const highlight = {
          red: new Set(), yellow: new Set(), green: new Set(),
        }
        if (data.hoveredValue !== null) {
          highlight.yellow.add(data.hoveredValue.val);
        }

        if (x == 0) {
          items.push(Vue.h(TowersHintCellComponent, {
            background: backgroundMaps.get(-1, y),
            value: puzzle.getHints(HintFace.WEST)[y],
            marked: puzzle.westHintMarked[y],
            clickable: towersUpgrades.markHintSatisfied.isUnlocked,
            onClick: () => {
              if (towersUpgrades.markHintSatisfied.isUnlocked) {
                puzzle.markHint(HintFace.WEST, y);
              }
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
          onRemove: (value: number) => { onRemove(y, x, value); },
          onGuess: (value: number) => { onGuess(y, x, value); },
          onSet: (value: number) => { onSet(y, x, value); },
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
            background: backgroundMaps.get(n, y),
            value: puzzle.getHints(HintFace.EAST)[y],
            marked: puzzle.eastHintMarked[y],
            clickable: towersUpgrades.markHintSatisfied.isUnlocked,
            onClick: () => {
              if (towersUpgrades.markHintSatisfied.isUnlocked) {
                puzzle.markHint(HintFace.EAST, y);
              }
            },
          }));
        }
      }

      // Empty bottom left corner
      items.push(Vue.h('div'))
      for (let i = 0; i < n; ++i) {
        items.push(Vue.h(TowersHintCellComponent, {
          background: backgroundMaps.get(i, n),
          value: puzzle.getHints(HintFace.SOUTH)[i],
          marked: puzzle.southHintMarked[i],
          clickable: towersUpgrades.markHintSatisfied.isUnlocked,
          onClick: () => {
            if (towersUpgrades.markHintSatisfied.isUnlocked) {
              puzzle.markHint(HintFace.SOUTH, i);
            }
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
