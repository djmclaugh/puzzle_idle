import Vue from './vue.js'
import StatusComponent from './components/status.js'
import InterfaceComponent from './components/interface.js'
import { currentStatus } from './data/status.js'

interface AppData {}

const App = {
  setup(): any {
    const data: AppData = Vue.reactive({});

    return () => {
      let items = [];
      items.push(Vue.h(StatusComponent));
      items.push(Vue.h(InterfaceComponent, {
        interfaceId: 0,
      }));

      return Vue.h('div', {}, items);
    }
  }
};

Vue.createApp(App).mount('app');
