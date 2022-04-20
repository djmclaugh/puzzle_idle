import Vue from '../vue.js'

import { makeUpgradButton } from './util/upgrade_button.js'
import { secondsToString } from './util/units.js'

import { makeManualPower } from './power/manual_power.js'
import { makeBiomassPower } from './power/biomass_power.js'

import { currentPower } from '../data/power.js'
import { currentStatus } from '../data/status.js'
const biomassPower = currentPower.biomassPower;

export default {
  setup() {
    return () => {
      let items = [];

      items.push(makeManualPower());

      if (biomassPower.level == 0 && currentStatus.allTimeMoney >= 5) {
        items.push(Vue.h('div', { style: {'margin-top': '8px'}}, [
          Vue.h('strong', {}, 'Biomass Energy'),
          ": ",
          makeUpgradButton({cost: 5, callback: () => {
            biomassPower.level = 1;
          }}),
        ]));
      } else if (biomassPower.level > 0){
        items.push(makeBiomassPower());
      }

      const info = [
        Vue.h('strong', {style: {display: 'inline-block'}}, `Power`),
        ' | ',
        Vue.h('span', {style: {display: 'inline-block'}}, `${currentPower.generatedPower} W`),
      ];
      if (biomassPower.level > 0) {
        info.push(' | ');
        const secondsLeft = biomassPower.biomassMilligrams / biomassPower.milligramsPerTick / 10;
        const timeLeft = secondsToString(secondsLeft);
        info.push(Vue.h('span', {style: {display: 'inline-block'}}, `${timeLeft} of biomass left`))
      }
      return Vue.h('details', {open: true}, [
        Vue.h('summary', {}, info),
        Vue.h('div', {}, items),
      ]);
    }
  }

}
