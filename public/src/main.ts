import Vue from './vue.js'
import { SudokuComponent } from './components/sudoku.js'

const App = {
  render() {
    const s1 = Vue.h(SudokuComponent, {
      size: 1,
    });
    const s2 = Vue.h(SudokuComponent, {
      size: 2,
    });
    const s3 = Vue.h(SudokuComponent, {
      size: 3,
    });
    return Vue.h('div', {}, [s1, s2, s3]);
  },
};

Vue.createApp(App).mount('app');
