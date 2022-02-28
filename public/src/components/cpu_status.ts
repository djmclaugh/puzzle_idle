import Vue from '../vue.js'

import ProcessComponent from './process.js'

import { currentStatus } from '../data/status.js'
import { currentCPU } from '../data/cpu.js'
import Process from '../data/process.js'

// Process components can cause issues if recycled.
// Since they are cheap to render, simply re-render them each time.
let processKey = 0;

export default {
  setup() {
    return () => {
      let items = [];

      items.push(Vue.h('p', {}, [
        `Max Speed: ${currentCPU.maxSpeed} Hz `,
        Vue.h('button', {
          onClick: () => {
            currentStatus.upgradeCpuSpeed();
          },
          disabled: !currentStatus.canAffordCpuSpeedUpgrade(),
        }, `Upgrade ($${currentStatus.cpuSpeedUpgradeCost})`)
      ]));

      items.push(Vue.h('p', {}, [
        `Number of Cores: ${currentCPU.cores} `,
        Vue.h('button', {
          onClick: () => {
            currentStatus.upgradeCpuCores();
          },
          disabled: !currentStatus.canAffordCpuCoresUpgrade(),
        }, `Upgrade ($${currentStatus.cpuCoresUpgradeCost})`)
      ]));

      const activeProcesses: (Process<any>|null)[] = Array.from(currentCPU.activeProcesses).sort();
      while (activeProcesses.length < currentCPU.cores) {
        activeProcesses.push(null);
      }
      let empty_message = Vue.h('em', {}, 'Currently no active processes');
      let process_list = Vue.h('ul', {}, activeProcesses.map(p => Vue.h(ProcessComponent, {
        key: processKey++,
        process: p,
        showInterface: true,
      })));
      if (currentCPU.cores > 0) {
        items.push(Vue.h('p', {}, [
          `Active Processes: `,
          activeProcesses.length == 0 ? empty_message : process_list,
        ]));
      }

      const queue = currentCPU.queue.toArray();
      empty_message = Vue.h('em', {}, 'No processes currently in queue');
      process_list = Vue.h('ul', {}, queue.map(p => Vue.h(ProcessComponent, {
        key: processKey++,
        process: p,
        showInterface: true,
      })));
      items.push(Vue.h('p', {}, [
        `Process Queue: `,
        queue.length == 0 ? empty_message : process_list,
      ]));

      // TODO: Allow under/overclocking

      return Vue.h('details', {open: true}, [
        Vue.h('summary', {}, "CPU"),
        Vue.h('div', {}, items),
      ]);
    }
  }

}
