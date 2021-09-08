import Vue from '../vue.js'
import { currentStatus } from '../data/status.js'

export default {
  setup() {
    return () => {
      let items = [];
      items.push(Vue.h('p', {}, `Current money: $${currentStatus.money}`));

      items.push(Vue.h('p', {}, [
        `RAM: Using ${currentStatus.usedRam} of ${currentStatus.maxRam} Bytes `,
        Vue.h('button', {
          onClick: () => {
            currentStatus.upgradeRam();
          },
          disabled: !currentStatus.canAffordRamUpgrade(),
        }, `Upgrade ($${currentStatus.ramUpgradeCost})`)
      ]));

      items.push(Vue.h('p', {}, [
        `CPU Core Speed: ${currentStatus.cpuSpeed} Hz `,
        Vue.h('button', {
          onClick: () => {
            currentStatus.upgradeCpuSpeed();
          },
          disabled: !currentStatus.canAffordCpuSpeedUpgrade(),
        }, `Upgrade ($${currentStatus.cpuSpeedUpgradeCost})`)
      ]));

      items.push(Vue.h('p', {}, [
        `CPU Cores: Using ${currentStatus.cpuCoresInUse} of ${currentStatus.cpuCores} cores `,
        Vue.h('button', {
          onClick: () => {
            currentStatus.upgradeCpuCores();
          },
          disabled: !currentStatus.canAffordCpuCoresUpgrade(),
        }, `Upgrade ($${currentStatus.cpuCoresUpgradeCost})`)
      ]));

      items.push(Vue.h('p', {}, [
        `Number of Interfaces: ${currentStatus.interfaces.length} `,
        Vue.h('button', {
          onClick: () => {
            currentStatus.upgradeNumberOfInterfaces();
          },
          disabled: !currentStatus.canAffordNumberOfInterfacesUpgrade(),
        }, `Upgrade ($${currentStatus.numberOfInterfacesUpgradeCost})`)
      ]));

      return Vue.h('div', {}, items);
    }
  }

}
