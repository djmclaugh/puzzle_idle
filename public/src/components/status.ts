import Vue from '../vue.js'
import { currentStatus } from '../data/status.js'

export default {
  setup() {
    return () => {
      let items = [];
      items.push(Vue.h('p', {}, `Current money: $${currentStatus.money}`));
      items.push(Vue.h('p', {}, `RAM: ${currentStatus.ram} KB`));

      items.push(Vue.h('p', {}, [
        `Validation Speed: ${currentStatus.validationSpeed} steps per second. `,
        Vue.h('button', {
          onClick: () => {
            currentStatus.upgradeValidationSpeed()
          },
          disabled: !currentStatus.canAffordValidationSpeedUpgrade(),
        }, `Upgrade ($${currentStatus.validationSpeedUpgradeCost})`)
      ]));

      return Vue.h('div', {}, items);
    }
  }

}
