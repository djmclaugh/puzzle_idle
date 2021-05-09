import Vue from '../vue.js'
import { SudokuCellComponent } from './sudoku_cell.js'

interface SudokuComponentProps {
  size: number,
}

export const SudokuComponent = {
  props: {
    size: Number
  },

  setup(props: SudokuComponentProps) {
    return () => {
      const items = [];
      for (let i = 0; i < props.size * props.size; ++i) {
        const cell = Vue.h(SudokuCellComponent, {
          size: props.size,
        });
        items.push(cell);
      }
      return Vue.h('div', {
        class: ['sudoku-grid', 'sudoku-grid-'+props.size],
      }, items);
    };
  },
}
