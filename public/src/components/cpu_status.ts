import Vue from '../vue.js'

import { makeUpgradButton } from './util/upgrade_button.js'
import { makeCollapsableFieldset } from './util/collapsable_fieldset.js'

import ProcessComponent from './process.js'

import { currentStatus } from '../data/status.js'
import { towersUpgrades } from '../data/towers/towers_upgrades.js'
import { currentCPU } from '../data/cpu.js'
import { currentPower } from '../data/power.js'
import Process from '../data/process.js'

export default {
  setup() {
    function generateActiveRoutinesContent() {
      const activeProcesses: (Process<any>|null)[] = Array.from(currentCPU.activeProcesses).sort();
      while (activeProcesses.length < currentCPU.cores) {
        activeProcesses.push(null);
      }
      let process_list = activeProcesses.map(p => Vue.h(ProcessComponent, {
        process: p,
        showInterface: true,
        style: {
          'margin-left': '16px',
        },
      }));
      return process_list;
    }

    function generateQueueContent() {
      const queue = currentCPU.queue.toArray();

      const empty_message = Vue.h('em', {
        style: {
          'text-align': 'center',
          'display': 'inline-block',
          'width': '100%'
        }
      }, 'No routines currently in queue');
      const process_list = queue.map(p => Vue.h(ProcessComponent, {
        process: p,
        showInterface: true,
        style: {
          'margin-left': '16px',
        },
      }));
      return queue.length == 0 ? empty_message : process_list;
    }

    return () => {
      let items = [];

      const currentSpeed = currentCPU.speedForPower(currentPower.power);

      items.push(Vue.h('div', { style: {'margin-top': '8px'}}, [
        Vue.h('strong', {}, 'Max Speed'),
        ': ',
        `${currentCPU.maxSpeed} Hz`,
        ' ',
        makeUpgradButton({
          label: "+1 Hz",
          cost: currentStatus.cpuSpeedUpgradeCost,
          callback: () => { currentCPU.maxSpeed += 1; },
        }),
      ]));

      const showQueueInfo = towersUpgrades.interfaces.length > 1 || towersUpgrades.maxView.isUnlocked || towersUpgrades.oneView.isUnlocked || towersUpgrades.lastCellLeftProcess.isUnlocked || towersUpgrades.removeFromColumnRowProcess.isUnlocked;
      if (showQueueInfo) {
        items.push(Vue.h('div', { style: {'margin-top': '8px'}}, [
          Vue.h('strong', {}, 'Number of Cores'),
          ': ',
          `${currentCPU.cores}`,
          ' ',
          makeUpgradButton({
            label: "+1 Core",
            cost: currentStatus.cpuCoresUpgradeCost,
            callback: () => { currentCPU.cores += 1; },
          }),
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

      items.push(makeCollapsableFieldset({
        label: `Active Routines (${currentCPU.coresInUse}/${currentCPU.cores})`,
        id: "active_routines_fieldset",
        collapsed: false,
      }, generateActiveRoutinesContent));

      if (showQueueInfo) {
        items.push(makeCollapsableFieldset({
          label: "Queued Routines",
          id: "queued_routines_fieldset",
          collapsed: true,
        }, generateQueueContent));
      }

      const info = [Vue.h('strong', {style: {display: 'inline-block'}}, `CPU`)];

      if (currentCPU.cores > 1) {
        info.push(' | ')
        info.push(Vue.h('span', {style: {display: 'inline-block'}}, `${currentCPU.coresInUse} active cores @ ${currentCPU.coresInUse == 0 ? 'N/A' : currentSpeed} Hz`));
      } else {
        info.push(' | ')
        info.push(Vue.h('span', {style: {display: 'inline-block'}}, `${currentCPU.coresInUse == 0 ? '0' : currentSpeed} Hz`));
      }

      if (showQueueInfo) {
        info.push(' | ')
        info.push(Vue.h('span', {style: {display: 'inline-block'}}, `${currentCPU.queue.toArray().length} routines in queue`));      }

      return Vue.h('details', {open: true}, [
        Vue.h('summary', {}, info),
        Vue.h('div', {}, items),
      ]);
    }
  }

}
