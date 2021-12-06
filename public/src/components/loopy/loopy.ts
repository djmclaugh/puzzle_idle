import Vue from '../../vue.js'
import Loopy from '../../puzzles/loopy/loopy.js'

interface LoopyComponentProps {
  puzzle: Loopy,
  interactive: boolean,
}

export default {
  props: ['puzzle', 'interactive'],

  setup(props: LoopyComponentProps) {
    return () => {
      const items = [];
      const puzzle = props.puzzle;
      const n = puzzle.n;

      for (let i = 0; i < n; ++i) {
        // dots and edges row
        for (let j = 0; j < (2 * n) + 1; ++j) {
          if (j % 2 == 0) {
            items.push(Vue.h('div', {class: ['dot']}))
          } else {
            items.push(Vue.h('div'))
          }
        }
        // edges and cells row
        for (let j = 0; j < (2 * n) + 1; ++j) {
          if (j % 2 == 0) {
            items.push(Vue.h('div'))
          } else {
            const hint = puzzle.getHint(i, (j - 1) / 2);
            if (hint === undefined) {
              items.push(Vue.h('div'))
            } else {
              items.push(Vue.h('div', {class: ['loopy-hint']}, hint.toString()))
            }
          }
        }
      }
      // Bottom dots and edges row
      for (let j = 0; j < (2 * n) + 1; ++j) {
        if (j % 2 == 0) {
          items.push(Vue.h('div', {class: ['dot']}))
        } else {
          items.push(Vue.h('div'))
        }
      }

      return Vue.h('div', {
        class: ['loopy-grid', 'loopy-grid-'+n],
      }, items);
    };

  }
}
