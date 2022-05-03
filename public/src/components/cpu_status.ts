import Vue from '../vue.js'

import LabeledCheckbox from './util/labeled_checkbox.js'

import ProcessComponent from './process.js'

import { currentStatus } from '../data/status.js'
import { towersUpgrades } from '../data/towers/towers_upgrades.js'
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

      const showQueueInfo = towersUpgrades.interfaces.length > 1 || towersUpgrades.maxView.isUnlocked || towersUpgrades.oneView.isUnlocked || towersUpgrades.lastCellLeftProcess.isUnlocked || towersUpgrades.removeFromColumnRowProcess.isUnlocked;
      if (showQueueInfo) {
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
      }

      let status: string = "No routines to run";
      if (currentCPU.coresInUse > 0) {
        const maxPowerConsumption = currentCPU.coresInUse * Math.pow(currentCPU.maxSpeed, 2);
        if (maxPowerConsumption == currentPower.power) {
          status = "Limited by max speed AND available power."
        } else if (maxPowerConsumption < currentPower.power) {
          status = `Limited by max speed. Enough power to go up to ${Math.pow(currentPower.power / currentCPU.coresInUse, 0.5).toFixed(2)} Hz.`
        } else {
          status = `Limited by available power. Would need ${maxPowerConsumption} W to attain max speed.`
        }
      }
      items.push(Vue.h('div', { style: {'margin-top': '8px'}}, [
        Vue.h('strong', {}, 'Status'),
        ': ',
        status,
      ]));

      items.push(Vue.h('div', { style: {'margin-top': '8px'}}, [
        Vue.h('strong', {}, 'Power Consumption'),
        ': #Active Cores × Speed² = ',
        `${currentCPU.coresInUse} × ${currentSpeed}² = `,
        `${currentCPU.powerForSpeed(currentSpeed)} W`,
      ]));

      const activeProcesses: (Process<any>|null)[] = Array.from(currentCPU.activeProcesses).sort();
      while (activeProcesses.length < currentCPU.cores) {
        activeProcesses.push(null);
      }
      let empty_message = Vue.h('em', {}, 'Currently no active routines');
      let process_list = Vue.h('ul', {}, activeProcesses.map(p => Vue.h(ProcessComponent, {
        process: p,
        showInterface: true,
      })));
      if (currentCPU.cores > 0) {
        items.push(Vue.h('p', {}, [
          `Active Routines: `,
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
        label: "Show routines waiting in queue",
        boxId: "show_queue_checkbox",
        onChange: (e: Event) => {
          const t: HTMLInputElement = e.target as HTMLInputElement;
          showQueue.value = t.checked;
        }
      });

      empty_message = Vue.h('em', {}, 'No routines currently in queue');
      process_list = Vue.h('ul', {}, queue.map(p => Vue.h(ProcessComponent, {
        process: p,
        showInterface: true,
      })));
      if (showQueueInfo) {
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
      }

      const info = [Vue.h('strong', {style: {display: 'inline-block'}}, `CPU`)];

      if (showQueueInfo) {
        info.push(' | ')
        info.push(Vue.h('span', {style: {display: 'inline-block'}}, `${currentCPU.coresInUse} cores active (max ${currentCPU.cores})`));
      }

      info.push(' | ')
      info.push(Vue.h('span', {style: {display: 'inline-block'}}, `${currentCPU.coresInUse == 0 ? '0' : currentSpeed} Hz`));

      if (showQueueInfo) {
        info.push(' | ')
        info.push(Vue.h('span', {style: {display: 'inline-block'}}, `${queue.length} in queue`));
      }

      return Vue.h('details', {open: true}, [
        Vue.h('summary', {}, info),
        Vue.h('div', {}, items),
      ]);
    }
  }

}
