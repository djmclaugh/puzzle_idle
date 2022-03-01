import Vue from '../../vue.js'

interface TowersHintCellComponentProps {
  value: number,
  marked: boolean,
  clickable: boolean,
}

interface TowersHintCellComponentData {
  hover: boolean,
}

export default {
  props: ['value', 'marked', 'clickable'],

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
          opacity: data.hover || props.marked ? 0.5 : 1,
        },
        onMouseover: () => { data.hover = props.clickable && true; },
        onMouseout: () => { data.hover = false; },
      }, props.value == -1 ? "" : props.value);
    };

  },
}
