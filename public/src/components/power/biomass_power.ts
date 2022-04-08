import Vue from '../../vue.js'

import { makeUpgradButton } from '../util/upgrade_button.js'

import { currentPower } from '../../data/power.js'
const biomassPower = currentPower.biomassPower;

const BiomassPowerComponent = {
  setup() {
    return () => {
      let items = [Vue.h('legend', {}, "Biomass Power")];

      const collect = Vue.h('button', {
          onMousedown: () => {
            biomassPower.manualCollect = true;
          },
          onMouseup: () => {
            biomassPower.manualCollect = false;
          },
          onMouseout: () => {
            biomassPower.manualCollect = false;
          },
        }, `Keep pressed to generate ${biomassPower.collectLevel} g/s of biomass`);
      items.push(Vue.h('div', { style: {'margin-top': '8px'}}, [
        Vue.h('strong', {}, `Collect Branches`),
        ': ',
        collect,
        ` ${biomassPower.biomass.toFixed(1)} g collected (max storage: ${biomassPower.furnaceCapacity} g)`,
      ]));

      items.push(Vue.h('div', { style: {'margin-top': '8px'}}, [
        Vue.h('strong', {}, `Furnace`),
        `: Burns ${biomassPower.furnaceSpeed} g/s and generates ${biomassPower.furnaceEfficiency} J/g for a total of ${(biomassPower.maxOutput).toFixed(1)} W`,
      ]));

      items.push(makeUpgradButton({
        cost: biomassPower.furnaceCapacity,
        label: `+10 g storage`,
        callback: () => {
          biomassPower.furnaceCapacity += 10;
        },
      }));
      items.push(" ");
      items.push(makeUpgradButton({
        cost: biomassPower.furnaceSpeed * 100,
        label: `+0.1 g/s burn speed`,
        callback: () => {
          biomassPower.milligramsPerTick += 10;
        },
      }));
      items.push(" ");
      items.push(makeUpgradButton({
        cost: biomassPower.furnaceEfficiency * 10,
        label: `+1 J/g efficiency`,
        callback: () => {
          biomassPower.furnaceEfficiency += 1;
        },
      }));

      items.push(Vue.h('div', { style: {'margin-top': '8px'}}, [
        Vue.h('strong', {}, `Furnace Status`),
        ': ',
        biomassPower.biomass == 0 ? "Out of biomass " : (biomassPower.furnaceOn ? "Burning " : "Off "),
        Vue.h('button', {
          onClick: () => {
            biomassPower.furnaceOn = ! biomassPower.furnaceOn;
          },
        }, biomassPower.furnaceOn ? "Turn Off" : "Turn On"),
      ]));

      return Vue.h('fieldset', {}, items);
    }
  }
};

export function makeBiomassPower(extra = {}) {
  return Vue.h(BiomassPowerComponent, extra);
}
