import Vue from '../vue.js'

import LabeledCheckbox from './util/labeled_checkbox.js'

import ProcessComponent from './process.js'

import { currentStatus } from '../data/status.js'
import { currentCPU } from '../data/cpu.js'
import { currentPower } from '../data/power.js'
import Process from '../data/process.js'

export default {
  setup() {
    const showQueue = Vue.ref(false);
    return () => {
      let items = [];

      const currentSpeed = currentCPU.speedForPower(currentPower.power);

      items.push(Vue.h('div', { style: {'margin-top': '8px'}}, [
        Vue.h('strong', {}, 'Max Speed'),
        ': ',
        `${currentCPU.maxSpeed} Hz`,
        ' ',
        Vue.h('button', {
          onClick: () => { currentStatus.upgradeCpuSpeed(); },
          disabled: !currentStatus.canAffordCpuSpeedUpgrade(),
        }, `+1 Hz ($${currentStatus.cpuSpeedUpgradeCost})`),
      ]));

      items.push(Vue.h('div', { style: {'margin-top': '8px'}}, [
        Vue.h('strong', {}, 'Number of Cores'),
        ': ',
        `${currentCPU.cores}`,
        ' ',
        Vue.h('button', {
          onClick: () => { currentStatus.upgradeCpuCores(); },
          disabled: !currentStatus.canAffordCpuCoresUpgrade(),
        }, `+1 Core ($${currentStatus.cpuCoresUpgradeCost})`),
      ]));

      items.push(Vue.h('div', { style: {'margin-top': '8px'}}, [
        Vue.h('strong', {}, 'Current Power Consumption'),
        ': #Active Cores × Speed² = ',
        `${currentCPU.coresInUse} × ${currentSpeed}² = `,
        `${currentCPU.powerForSpeed(currentSpeed)} W`,
      ]));

      // Vue.h('button', {
      //   onClick: () => { currentCPU.paused = !currentCPU.paused; },
      // }, currentCPU.paused ? 'Resume' : 'Pause'),

      const activeProcesses: (Process<any>|null)[] = Array.from(currentCPU.activeProcesses).sort();
      while (activeProcesses.length < currentCPU.cores) {
        activeProcesses.push(null);
      }
      let empty_message = Vue.h('em', {}, 'Currently no active processes');
      let process_list = Vue.h('ul', {}, activeProcesses.map(p => Vue.h(ProcessComponent, {
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

      const showQueueCheckbox = Vue.h(LabeledCheckbox, {
        style: {
          display: 'inline-block',
          'margin-left': '0px',
          'margin-right': '0px',
        },
        value: showQueue.value,
        label: "Show processes waiting in queue",
        boxId: "show_queue_checkbox",
        onChange: (e: Event) => {
          const t: HTMLInputElement = e.target as HTMLInputElement;
          showQueue.value = t.checked;
        }
      });

      empty_message = Vue.h('em', {}, 'No processes currently in queue');
      process_list = Vue.h('ul', {}, queue.map(p => Vue.h(ProcessComponent, {
        process: p,
        showInterface: true,
      })));
      if (showQueue.value) {
        items.push(Vue.h('p', {}, [
          showQueueCheckbox,
          ": ",
          queue.length == 0 ? empty_message : process_list,
        ]));
      } else {
        items.push(Vue.h('p', {}, [
          showQueueCheckbox
        ]));
      }

      // TODO: Allow under/overclocking

      return Vue.h('details', {open: true}, [
        Vue.h('summary', {}, [
          Vue.h('strong', {style: {display: 'inline-block'}}, `CPU`),
          ' | ',
          Vue.h('span', {style: {display: 'inline-block'}}, `${currentCPU.coresInUse} cores active (max ${currentCPU.cores})`),
          ' | ',
          Vue.h('span', {style: {display: 'inline-block'}}, `${currentCPU.coresInUse == 0 ? 'N/A' : currentSpeed} Hz (max ${currentCPU.maxSpeed} Hz)`),
          ' | ',
          Vue.h('span', {style: {display: 'inline-block'}}, `${queue.length} in queue`),
        ]),
        Vue.h('div', {}, items),
      ]);
    }
  }

}
