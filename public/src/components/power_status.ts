import Vue from '../vue.js'

import { makeUpgradButton } from './util/upgrade_button.js'
import { secondsToString, metricToString } from './util/units.js'

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

      if (biomassPower.level == 0 && currentStatus.allTimeMoney >= 3) {
        items.push(Vue.h('div', { style: {'margin-top': '8px'}}, [
          Vue.h('strong', {}, 'Biomass Energy'),
          ": ",
          makeUpgradButton({cost: 1, callback: () => {
            biomassPower.level = 1;
          }}),
        ]));
      } else if (biomassPower.level > 0){
        items.push(makeBiomassPower());
      }

      const info = [
        Vue.h('strong', {style: {display: 'inline-block'}}, `Power`),
        ' | ',
        Vue.h('span', {style: {display: 'inline-block'}}, `${metricToString(currentPower.generatedPower, "W")}`),
      ];
      if (biomassPower.level > 0) {
        info.push(' | ');
        if (biomassPower.setSpeed == 0) {
          info.push(Vue.h('span', {style: {display: 'inline-block'}}, `Furnace Off`))
        } else {
          let timeLeft: string;
          if (biomassPower.currentSpeed == 0) {
            timeLeft = secondsToString(0)
          } else {
            const secondsLeft = biomassPower.currentBiomass / biomassPower.currentSpeed;
            timeLeft = secondsToString(secondsLeft);
          }
          info.push(Vue.h('span', {style: {display: 'inline-block'}}, `${timeLeft} of biomass left`))
        }
      }
      return Vue.h('details', {open: true}, [
        Vue.h('summary', {}, info),
        Vue.h('div', {}, items),
      ]);
    }
  }

}
