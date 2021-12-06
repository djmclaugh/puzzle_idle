import Vue from './vue.js'
import StatusComponent from './components/status.js'
import LoopyInterface from './components/loopy/loopy_interface.js'
import TowersInterface from './components/towers/towers_interface.js'
import { currentStatus } from './data/status.js'

interface AppData {
  currentInterface: number,
}

const App = {
  setup(): any {
    const data: AppData = Vue.reactive({
      currentInterface: 0,
    });

    return () => {
      let items = [];
      items.push(Vue.h(StatusComponent));
      items.push(Vue.h('h3', {}, 'Interfaces: '));
      for (let i = 0; i < currentStatus.interfaces.length; ++i) {
        items.push(Vue.h('div', {
          class: {
            'interface-selector': true,
            'interface-selector-selected': i == data.currentInterface,
          },
          onClick: () => {
            data.currentInterface = i;
          }
        }, "" + (i + 1)));
      }

      items.push(Vue.h('br'));
      items.push(Vue.h('br'));

      for (let i = 0; i < currentStatus.interfaces.length; ++i) {
        items.push(Vue.h(LoopyInterface, {
          key: i,
          interfaceId: i,
          isCurrent: i == data.currentInterface,
        }));
      }

      return Vue.h('div', {}, items);
    }
  }
};

Vue.createApp(App).mount('app');
