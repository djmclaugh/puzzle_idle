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
        }, `Keep pressed to generate ${gramsToString(Math.pow(2, biomassPower.collectLevel))}/s of biomass`);

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
        ` ${gramsToString(biomassPower.biomass)} collected (capacity: ${gramsToString(biomassPower.furnaceCapacity)})`,
      ]));

      if (nextUpgrade != "") {
        items.push(Vue.h('div', { style: {'margin-top': '8px'}}, [
          Vue.h('strong', {}, nextUpgrade), ": " + nextDescription + " ",
          makeUpgradButton({cost: Math.pow(3, biomassPower.collectLevel + 1), callback: () => {
            biomassPower.collectLevel += 1;
          }}),
        ]));
      }

      items.push(Vue.h('div', { style: {'margin-top': '8px'}}, [
        Vue.h('strong', {}, `Furnace`),
        `: Burns ${biomassPower.furnaceSpeed} g/s and generates ${biomassPower.furnaceEfficiency} J/g for a total of ${(biomassPower.maxOutput).toFixed(1)} W`,
      ]));

      const capacityIncrease = Math.pow(10, Math.floor(Math.log10(biomassPower.furnaceCapacity)));
      items.push(makeUpgradButton({
        cost: biomassPower.furnaceCapacity * capacityIncrease / 100,
        label: `+${gramsToString(capacityIncrease)} capacity`,
        callback: () => {
          biomassPower.furnaceCapacity += capacityIncrease;
        },
      }));
      items.push(" ");
      items.push(makeUpgradButton({
        cost: (biomassPower.furnaceSpeed - 0.4) * 50,
        label: `+0.1 g/s burn speed`,
        callback: () => {
          biomassPower.milligramsPerTick += 10;
        },
      }));
      items.push(" ");
      items.push(makeUpgradButton({
        cost: 5 * Math.pow(2, biomassPower.furnaceEfficiency - 1),
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
