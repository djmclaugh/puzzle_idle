import Vue from '../../vue.js'
import ValidationProcess from '../../data/processes/validation_process.js'

interface TowersValidatorComponentProps {
  process: ValidationProcess,
}

export default {
  props: ['process'],

  setup(props: TowersValidatorComponentProps): any {
    return () => {
      const items = [];
      for (const logSection of props.process.logs) {
        items.push(Vue.h('h3', {}, logSection[0]));
        for (let i = 1; i < logSection.length; ++i) {
          items.push(Vue.h('p', {}, logSection[i]));
        }
      }
      return Vue.h('div', {}, items);
    };
  }
}
