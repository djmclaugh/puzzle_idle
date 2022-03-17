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
      const checkbox = Vue.h('input', {
        type: 'checkbox',
        id: props.boxId,
        checked: props.value,
      });
      return Vue.h('label', {
        class: 'labeled-checkbox',
        id: props.boxId + "_label",
        for: props.boxId,
      }, [
        checkbox,
        props.label,
      ]);
    }
  }
};
