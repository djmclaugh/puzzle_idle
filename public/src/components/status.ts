import Vue from '../vue.js'
import { currentStatus } from '../data/status.js'

export default {
  setup() {
    return () => {
      let items = [];
      items.push(Vue.h('p', {}, `Current money: $${currentStatus.money}`));

      
      //
      // items.push(Vue.h('p', {}, [
      //   `Number of Interfaces: ${currentStatus.interfaces.length} `,
      //   Vue.h('button', {
      //     onClick: () => {
      //       currentStatus.upgradeNumberOfInterfaces();
      //     },
      //     disabled: !currentStatus.canAffordNumberOfInterfacesUpgrade(),
      //   }, `Upgrade ($${currentStatus.numberOfInterfacesUpgradeCost})`)
      // ]));

      return Vue.h('div', {}, items);
    }
  }

}
