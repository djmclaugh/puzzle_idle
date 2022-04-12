import Vue from '../../vue.js'

import { makeUpgradButton } from '../util/upgrade_button.js'

import { currentPower } from '../../data/power.js'

const ManualPowerComponent = {
  setup() {
    return () => {
      let items = [Vue.h('legend', {}, "Manual Energy")];

      let verb = "Hand Crank";
      let nextUpgrade = "Better Hand Crank Generator";
      let nextDescription = "More efficient generator that produces twice as much power.";
      if (currentPower.crankLevel == 1) {
        verb = "Hand Crank";
        nextUpgrade = "Second Hand Crank Generator";
        nextDescription = "Let's you use both your hands at once!";
      } else if (currentPower.crankLevel == 2) {
        verb = "Hand Crank (Both Hands)";
        nextUpgrade = "Better Hand Crank Generator";
        nextDescription = "More efficient generator that produces twice as much power.";
      } else if (currentPower.crankLevel == 3) {
        verb = "Hand Crank (Both Hands)";
        nextUpgrade = "Stationary Bike";
        nextDescription = "Hook up your generators to a stationary bike.";
      } else if (currentPower.crankLevel == 4) {
        verb = "Pedal";
        nextUpgrade = "Better Generator";
        nextDescription = "More efficient generator that produces twice as much power.";
      } else if (currentPower.crankLevel == 5) {
        verb = "Pedal";
        nextUpgrade = "";
        nextDescription = "";
      }

      const crank = Vue.h('button', {
          onMousedown: () => { currentPower.manualCrank = true; },
          onMouseup: () => { currentPower.manualCrank = false; },
          onMouseout: () => { currentPower.manualCrank = false; },
        }, `Keep pressed to generate ${Math.pow(2, currentPower.crankLevel)} W`);

      items.push(Vue.h('div', { style: {'margin-top': '8px'}}, [
        Vue.h('strong', {}, verb), ': ', crank,
      ]));

      if (nextUpgrade != "") {
        items.push(Vue.h('div', { style: {'margin-top': '8px'}}, [
          Vue.h('strong', {}, nextUpgrade), ": " + nextDescription  + " ",
          makeUpgradButton({cost: Math.pow(2, currentPower.crankLevel), callback: () => {
            currentPower.crankLevel += 1;
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
