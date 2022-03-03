import Vue from '../vue.js'
import Process from '../data/process.js'

import { currentCPU } from '../data/cpu.js'

interface ProcessProps {
  process: Process<any>|null,
  showInterface: boolean,
}

export default {
  props: ['process', 'showInterface'],
  setup(props: ProcessProps): any {
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
      if (props.process) {
        const runButton = Vue.h('button', {
          onMousedown: () => { currentCPU.boostedProcess = props.process; },
          onMouseup: () => { currentCPU.boostedProcess = null; },
          onMouseout: () => { currentCPU.boostedProcess = null; },
        }, currentCPU.isActive(props.process) ? 'Speed Up (keep pressed)' : 'Manually Run (keep pressed)');

        return Vue.h('li', {style: {height: '32px'}}, [runButton, " ", processDescription()]);
      } else {
        return Vue.h('li', {style: {height: '32px'}}, Vue.h('em', {}, 'Core available'));
      }
    }
  }
};
