import Vue from '../../vue.js'
import ValidationProcess from '../../data/processes/towers/validation_process.js'

interface TowersValidatorComponentProps {
  process: ValidationProcess,
}

interface TowersValidatorComponentData {
  logs: string[][],
}

export default {
  props: ['process'],

  setup(props: TowersValidatorComponentProps): any {
    const data: TowersValidatorComponentData = Vue.reactive({
      logs: props.process.logs.concat(),
    });

    props.process.onTick(() => {
      data.logs = props.process.logs.concat();
      Vue.nextTick(() => {
        const element = document.getElementById('validation-process-info');
        if (element) {
          element.scrollTo({
            top: element.scrollHeight,
            behavior: 'smooth'
          });
        }
      })
    });

    return () => {
      const items = [];
      items.push(Vue.h('h2', {}, 'Validating Solution'));
      for (const logSection of data.logs) {
        items.push(Vue.h('h3', {}, logSection[0]));
        for (let i = 1; i < logSection.length; ++i) {
          items.push(Vue.h('p', {}, logSection[i]));
        }
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
