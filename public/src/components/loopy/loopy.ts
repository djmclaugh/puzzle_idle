import Vue from '../../vue.js'
import Loopy, {EdgeState} from '../../puzzles/loopy/loopy.js'

interface LoopyComponentProps {
  puzzle: Loopy,
  interactive: boolean,
}

export default {
  props: ['puzzle', 'interactive'],

  setup(props: LoopyComponentProps) {
    function hEdge(row: number, column: number): any {
      const state = props.puzzle.getHEdge(row, column);
      const classes = ['loopy-h-edge'];
      switch (state) {
        case EdgeState.UNKNOWN:
          classes.push('loopy-h-edge-unknown');
          break;
        case EdgeState.ON:
          classes.push('loopy-edge-on');
          break;
        case EdgeState.OFF:
          classes.push('loopy-edge-off');
          break;
      }
      const inner = Vue.h('div', {class: classes})
      return Vue.h('div', {
        class: ['loopy-edge-container', 'loopy-h-edge-container'],
        onClick: (e: MouseEvent) => {
          if (e.ctrlKey) {
            props.puzzle.setHEdge(row, column, state == EdgeState.OFF ? EdgeState.UNKNOWN : EdgeState.OFF);
          } else {
            props.puzzle.setHEdge(row, column, state == EdgeState.ON ? EdgeState.UNKNOWN : EdgeState.ON);
          }
        },
      }, inner);
    }

    function vEdge(row: number, column: number): any {
      const state = props.puzzle.getVEdge(row, column);
      const classes = ['loopy-v-edge'];
      switch (state) {
        case EdgeState.UNKNOWN:
          classes.push('loopy-v-edge-unknown');
          break;
        case EdgeState.ON:
          classes.push('loopy-edge-on');
          break;
        case EdgeState.OFF:
          classes.push('loopy-edge-off');
          break;
      }
      const inner = Vue.h('div', {class: classes})
      return Vue.h('div', {
        class: ['loopy-edge-container', 'loopy-v-edge-container'],
        onClick: (e: MouseEvent) => {
          if (e.ctrlKey) {
            props.puzzle.setVEdge(row, column, state == EdgeState.OFF ? EdgeState.UNKNOWN : EdgeState.OFF);
          } else {
            props.puzzle.setVEdge(row, column, state == EdgeState.ON ? EdgeState.UNKNOWN : EdgeState.ON);
          }
        },
      }, inner);
    }

    return () => {
      const items = [];
      const puzzle = props.puzzle;
      const n = puzzle.n;

      for (let i = 0; i < n; ++i) {
        // dots and edges row
        for (let j = 0; j < (2 * n) + 1; ++j) {
          if (j % 2 == 0) {
            items.push(Vue.h('div', {class: ['loopy-dot']}));
          } else {
            items.push(hEdge(i, (j - 1) / 2));
          }
        }
        // edges and cells row
        for (let j = 0; j < (2 * n) + 1; ++j) {
          if (j % 2 == 0) {
            items.push(vEdge(i, j / 2))
          } else {
            const hint = puzzle.getHint(i, (j - 1) / 2);
            if (hint === undefined) {
              items.push(Vue.h('div'));
            } else {
              items.push(Vue.h('div', {class: ['loopy-hint']}, hint.toString()));
            }
          }
        }
      }
      // Bottom dots and edges row
      for (let j = 0; j < (2 * n) + 1; ++j) {
        if (j % 2 == 0) {
          items.push(Vue.h('div', {class: ['loopy-dot']}));
        } else {
          items.push(hEdge(n, (j - 1) / 2));
        }
      }

      return Vue.h('div', {
        class: ['loopy-grid', 'loopy-grid-'+n],
      }, items);
    };

  }
}
