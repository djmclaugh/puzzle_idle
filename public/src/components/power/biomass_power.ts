import Vue from '../../vue.js'

import { makeUpgradButton } from '../util/upgrade_button.js'
import { makeCollapsableFieldset } from '../util/collapsable_fieldset.js'
import { gramsToString } from '../util/units.js'

import { currentPower } from '../../data/power.js'
const biomassPower = currentPower.biomassPower;

const verbs = [
  "Collect Leaves",
  "Rake Leaves",
  "Rake Leaves",
  "Collect Branches",
  "Axe Tree",
  "Axe Tree",
  "Chainsaw Tree",
  "Chainsaw Tree",
]
const upgrades = [
  ["Rake", "Collect leaves twice as fast."],
  ["Wheelbarrow", "Haul leaves twice as fast."],
  ["Collect Branches", "Collect branches instead of leaves."],
  ["Axe", "Cut down small trees instead of collecting branches."],
  ["Car", "Haul twice as fast."],
  ["Chainsaw", "Cut down trees twice as fast."],
  ["Truck", "Haul twice as fast."],
  ["", ""],
]

const BiomassPowerComponent = {
  setup() {
    function generateContents() {
      let items = [];

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

      let verb = verbs[biomassPower.collectLevel];
      let nextUpgrade = upgrades[biomassPower.collectLevel][0];
      let nextDescription = upgrades[biomassPower.collectLevel][1];

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
          cost: biomassPower.capacityUpgradeCost,
          label: `+${gramsToString(biomassPower.capacityUpgradeAmount)} capacity`,
          callback: () => {
            biomassPower.capacityLevel += 1;
          },
        }),
      ]));

      if (nextUpgrade != "") {
        items.push(Vue.h('div', { style: {'margin-top': '16px'}}, [
          Vue.h('strong', {}, nextUpgrade), ": " + nextDescription + " ",
          makeUpgradButton({cost: Math.pow(4, biomassPower.collectLevel), callback: () => {
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
        `${biomassPower.speedPercentage}% * ${biomassPower.maxSpeed} g/s = ${biomassPower.setSpeed.toFixed(2)} g/s`,
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
          cost: (biomassPower.speedLevel - 0.4) * 50,
          label: `+1 g/s max burn speed`,
          callback: () => {
            biomassPower.speedLevel += 1;
          },
        }),
      ]));
      return items;
    }

    return () => {
      return makeCollapsableFieldset({
        label: "Biomass Energy",
        id: "biomass_energy_fieldset",
        collapsed: false,
      }, generateContents);
    }
  }
};

export function makeBiomassPower(extra = {}) {
  return Vue.h(BiomassPowerComponent, extra);
}
