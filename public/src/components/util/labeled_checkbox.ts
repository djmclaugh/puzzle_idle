import Vue from '../../vue.js'

interface LabeledCheckboxProps {
  value: boolean,
  label: string,
  boxId: string,
  alternate?: [string, string],
}

export default {
  props: ['value', 'label', 'boxId', 'alternate'],

  setup(props: LabeledCheckboxProps) {
    return () => {

      const checkbox = Vue.h('input', {
        style: {
          display: !props.alternate ? undefined : 'none',
        },
        type: 'checkbox',
        id: props.boxId,
        checked: props.value,
      });

      const items = [checkbox, props.label];

      if (props.alternate) {
        items.push(" ");
        items.push(props.alternate[props.value ? 1 : 0]);
      }

      return Vue.h('label', {
        class: 'labeled-checkbox',
        id: props.boxId + "_label",
        for: props.boxId,
      }, items);
    }
  }
};
