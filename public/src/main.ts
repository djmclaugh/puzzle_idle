import Vue from './vue.js'
import StatusComponent from './components/status.js'
import InterfaceComponent from './components/interface.js'
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
      for (let i = 0; i < currentStatus.interfaces.length; ++i) {
        items.push(Vue.h(InterfaceComponent, {
          interfaceId: i,
          isCurrent: i == data.currentInterface,
        }));
      }

      return Vue.h('div', {}, items);
    }
  }
};

Vue.createApp(App).mount('app');
