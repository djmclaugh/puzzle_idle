import Vue from '../vue.js'
import Process from '../data/process.js'

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
      let message = `(T${p.interfaceId + 1}) `;
      message += p.friendlyName;
      message += ": " + p.currentAction;
      return message;
    }
    return () => {
      if (props.process) {
        return Vue.h('li', {}, processDescription());
      } else {
        return Vue.h('li', {}, Vue.h('em', {}, 'Core available'));
      }
    }
  }
};
