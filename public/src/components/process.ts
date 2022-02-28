import Vue from '../vue.js'
import Process from '../data/process.js'

import { currentCPU } from '../data/cpu.js'

interface ProcessProps {
  process: Process<any>|null,
  showInterface: boolean,
}

export default {
  props: ['process', 'showInterface'],
  setup(props: ProcessProps, {attrs, slots, emit}: any): any {
    function processDescription(): string {
      const p = props.process;
      if (p === null) {
        return 'Core available';
      }
      let message = `(Towers ${p.interfaceId + 1}) `;
      message += p.friendlyName;
      message += ": " + p.currentAction;
      return message;
    }
    return () => {
      let items = [];
      if (props.process) {
        const runButton = Vue.h('button', {
          onMousedown: () => { currentCPU.boostedProcess = props.process; },
          onMouseup: () => { currentCPU.boostedProcess = null; },
          onMouseout: () => { currentCPU.boostedProcess = null; },
        }, currentCPU.isActive(props.process) ? 'Speed Up (keep pressed)' : 'Manually Run (keep pressed)');

        return Vue.h('li', {}, [runButton, " ", processDescription()]);
      } else {
        return Vue.h('li', {}, Vue.h('em', {}, 'Core available'));
      }
    }
  }
};
