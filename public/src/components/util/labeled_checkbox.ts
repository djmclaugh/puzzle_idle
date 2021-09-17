import Vue from '../../vue.js'

interface LabeledCheckboxProps {
  value: boolean,
  label: string,
  boxId: string,
}

export default {
  props: ['value', 'label', 'boxId'],

  setup(props: LabeledCheckboxProps) {
    return () => {
      return Vue.h('div', {}, [
        Vue.h('input', {
          type: 'checkbox',
          id: props.boxId,
          checked: props.value,
        }),
        Vue.h('label', {
          id: props.boxId + "_label",
          for: props.boxId,
        }, props.label),
      ]);
    }
  }
};
