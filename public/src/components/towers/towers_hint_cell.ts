import Vue from '../../vue.js'

interface TowersHintCellComponentProps {
  value: number,
  marked: boolean,
}

interface TowersHintCellComponentData {
  hover: boolean,
}

export default {
  props: ['value', 'marked'],

  setup(props: TowersHintCellComponentProps) {

    const data: TowersHintCellComponentData = Vue.reactive({
      hover: false,
    });

    return () => {
      return Vue.h('div', {
        class: {
          'towers-hint': true,
          'towers-hint-marked': props.marked && props.value != - 1,
        },
        style: {
          opacity: data.hover ? 0.5 : 1,
        },
        onMouseover: () => { data.hover = true; },
        onMouseout: () => { data.hover = false; },
      }, props.value == -1 ? "" : props.value);
    };

  },
}
