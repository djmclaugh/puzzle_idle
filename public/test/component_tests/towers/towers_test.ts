import Vue from '../../../src/vue.js'
import TowersComponent from '../../../src/components/towers.js'
import Towers from '../../../src/puzzles/towers.js'

const App = {
  render() {
    const s3 = Vue.h(TowersComponent, {
      puzzle: new Towers(),
    });
    return Vue.h('div', {}, [s3]);
  },
};

Vue.createApp(App).mount('app');
