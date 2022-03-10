import Vue from '../../vue.js'
import ValidationProcess from '../../data/processes/towers/validation_process.js'

interface TowersValidatorComponentProps {
  process: ValidationProcess,
}

export default {
  props: ['process'],

  setup(props: TowersValidatorComponentProps): any {
    return () => {
      const items = [];
      items.push(Vue.h('h2', {}, 'Validating Solution'));
      for (const logSection of props.process.logs) {
        items.push(Vue.h('h3', {}, logSection[0]));
        for (let i = 1; i < logSection.length; ++i) {
          items.push(Vue.h('p', {}, logSection[i]));
        }
      }

      const element = document.getElementById('validation-process-info');
      if (element) {
        Vue.nextTick(() => {
          element.scrollTo({
            top: element.scrollHeight,
            behavior: 'smooth'
          });
        })
      }

      return Vue.h('div', {
        id: 'validation-process-info',
        class: [
          'towers-validation',
          'towers-validation-'+ props.process.size,
        ]
      }, items);
    };
  }
}
