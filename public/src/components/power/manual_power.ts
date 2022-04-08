import Vue from '../../vue.js'

import { makeUpgradButton } from '../util/upgrade_button.js'

import { currentPower } from '../../data/power.js'

const ManualPowerComponent = {
  setup() {
    return () => {
      let items = [Vue.h('legend', {}, "Manual Power")];

      const crank = Vue.h('button', {
          onMousedown: () => {
            currentPower.manualCrank = true;
          },
          onMouseup: () => {
            currentPower.manualCrank = false;
          },
          onMouseout: () => {
            currentPower.manualCrank = false;
          },
        }, `Keep pressed to generate ${currentPower.crankLevel} W`);
      items.push(Vue.h('div', { style: {'margin-top': '8px'}}, [
        Vue.h('strong', {}, `Hand Crank${currentPower.crankLevel==2 ? " (both hands)" : ""}`),
        ': ',
        crank,
      ]));

      if (currentPower.crankLevel == 1) {
        items.push(Vue.h('div', { style: {'margin-top': '8px'}}, [
          Vue.h('strong', {}, 'Second Hand Crank Generator'),
          ": Let's you use both your hands at once! ",
          makeUpgradButton({cost: 2, callback: () => {
            currentPower.crankLevel = 2;
          }}),
        ]));
      }
      return Vue.h('fieldset', {}, items);
    }
  }
};

export function makeManualPower(extra = {}) {
  return Vue.h(ManualPowerComponent, extra);
}
