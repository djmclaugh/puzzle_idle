import Vue from '../vue.js'
import { currentStatus } from '../data/status.js'

export default {
  setup() {
    return () => {
      let items = [];

      items.push(Vue.h('div', { style: {'margin-top': '8px'}}, [
        Vue.h('strong', {}, 'Current Money'),
        `: $${currentStatus.currentMoney}`,
      ]));

      items.push(Vue.h('div', { style: {'margin-top': '8px'}}, [
        Vue.h('strong', {}, 'Total Money Earned'),
        `: $${currentStatus.allTimeMoney}`,
      ]));

      items.push(Vue.h('div', { style: {'margin-top': '8px'}}, [
        Vue.h('strong', {}, 'Last Hour Average (This Session)'),
        `: $${currentStatus.lastHourAveragePerMinute.toFixed(2)}/min`,
      ]));

      if (currentStatus.nextStep) {
        items.push(Vue.h('div', { style: {'margin-top': '8px'}}, [
          Vue.h('strong', {}, 'Tutorial'),
          `: `,
          Vue.h('span', {'innerHTML': currentStatus.nextStep}),
        ]));
      }

      const info = [
        Vue.h('strong', {style: {display: 'inline-block'}}, `Stats`),
        ' | ',
        Vue.h('span', {style: {display: 'inline-block'}}, `$${currentStatus.currentMoney}`),
      ];

      return Vue.h('details', {open: true}, [
        Vue.h('summary', {}, info),
        Vue.h('div', {}, items),
      ]);
    }
  }

}
