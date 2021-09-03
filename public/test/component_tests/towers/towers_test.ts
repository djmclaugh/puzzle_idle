import Vue from '../../../src/vue.js'
import TowersComponent from '../../../src/components/towers.js'
import Towers from '../../../src/puzzles//towers/towers.js'

const towers = new Towers([[-1, -1, -1], [-1, -1, -1], [-1, -1, -1]], [1, -1, -1], [-1, 2, -1], [3, -1, -1], [-1, -1, -1]);

const App = {
  render() {
    const s3 = Vue.h(TowersComponent, {
      puzzle: towers,
    });
    return Vue.h('div', {}, [s3]);
  },
};

Vue.createApp(App).mount('app');
