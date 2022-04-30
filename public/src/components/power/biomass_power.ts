import Vue from '../../vue.js'

import { makeUpgradButton } from '../util/upgrade_button.js'
import { gramsToString } from '../util/units.js'

import { currentPower } from '../../data/power.js'
const biomassPower = currentPower.biomassPower;

const BiomassPowerComponent = {
  setup() {
    return () => {
      let items = [Vue.h('legend', {}, "Biomass Energy")];

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
        }, `Keep pressed to generate ${Math.pow(2, biomassPower.collectLevel)} g/s of biomass`);

      let verb = "Collect Leaves";
      let nextUpgrade = "Rake";
      let nextDescription = "Collect leaves twice as fast with a rake.";
      if (biomassPower.collectLevel == 1) {
        verb = "Rake Leaves";
        nextUpgrade = "Wheelbarrow";
        nextDescription = "Haul leaves twice as fast with a wheelbarrow.";
      } else if (biomassPower.collectLevel == 2) {
        verb = "Wheelbarrow Leaves";
        nextUpgrade = "Collect Branches";
        nextDescription = "Collect fallen branches instead of leaves.";
      } else if (biomassPower.collectLevel == 3) {
        verb = "Wheelbarrow Branches";
        nextUpgrade = "Axe";
        nextDescription = "Cut down small trees.";
      } else if (biomassPower.collectLevel == 4) {
        verb = "Axe Down Small Trees";
        nextUpgrade = "Chainsaw";
        nextDescription = "Cut down larger trees.";
      } else if (biomassPower.collectLevel == 5) {
        verb = "Chainsaw Trees";
        nextUpgrade = "";
        nextDescription = "";
      }
      items.push(Vue.h('div', { style: {'margin-top': '8px'}}, [
        Vue.h('strong', {}, verb),
        ': ',
        collect,
      ]));

      items.push(Vue.h('div', { style: {'margin-top': '16px'}}, [
        Vue.h('strong', {}, 'Storage'),
        `: ${gramsToString(biomassPower.currentBiomass)} collected (capacity: ${gramsToString(biomassPower.furnaceCapacity)})`,
        Vue.h('br'),
        makeUpgradButton({
          cost: Math.floor(Math.log10(biomassPower.capacityLevel)) + 1,
          label: `+${gramsToString(10)} capacity`,
          callback: () => {
            biomassPower.capacityLevel += 1;
          },
        }),
      ]));

      if (nextUpgrade != "") {
        items.push(Vue.h('div', { style: {'margin-top': '16px'}}, [
          Vue.h('strong', {}, nextUpgrade), ": " + nextDescription + " ",
          makeUpgradButton({cost: Math.pow(3, biomassPower.collectLevel + 1), callback: () => {
            biomassPower.collectLevel += 1;
          }}),
        ]));
      }

      items.push(Vue.h('div', { style: {'margin-top': '16px'}}, [
        Vue.h('strong', {}, `Furnace`),
        `: Burns ${biomassPower.currentSpeed} g/s and generates ${biomassPower.furnaceEfficiency} J/g for a total of ${(biomassPower.currentOutput).toFixed(2)} W`,
      ]));

      items.push(" ");
      items.push(" ");
      items.push(makeUpgradButton({
        cost: 5 * Math.pow(2, biomassPower.furnaceEfficiency - 1),
        label: `+1 J/g efficiency`,
        callback: () => {
          biomassPower.efficiencyLevel += 1;
        },
      }));

      items.push(Vue.h('div', { style: {'margin-top': '16px'}}, [
        Vue.h('strong', {}, `Adjust Speed`),
        ': ',
        `${biomassPower.speedPercentage}% * ${biomassPower.maxSpeed} g/s = ${biomassPower.setSpeed.toFixed(2)} g/s`
        Vue.h('br'),
        Vue.h('input', {
          style: {
            width: '40%',
            "min-width": '200px',
          },
          type: 'range',
          min: 0,
          max: 100,
          value: biomassPower.speedPercentage,
          onInput: (e: InputEvent) => {
            const t = e.target as HTMLInputElement;
            biomassPower.speedPercentage = Number.parseInt(t.value);
          },
        }),
        Vue.h('br'),
        makeUpgradButton({
          cost: (biomassPower.furnaceSpeed - 0.4) * 50,
          label: `+1 g/s max burn speed`,
          callback: () => {
            biomassPower.speedLevel += 1;
          },
        }),
      ]));

      return Vue.h('fieldset', {}, items);
    }
  }
};

export function makeBiomassPower(extra = {}) {
  return Vue.h(BiomassPowerComponent, extra);
}
