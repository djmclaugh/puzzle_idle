import Vue from '../../vue.js'

interface TowersHintCellComponentProps {
  background: string|undefined,
  value: number,
  marked: boolean,
  clickable: boolean,
}

interface TowersHintCellComponentData {
  hover: boolean,
}

export default {
  props: ['background', 'value', 'marked', 'clickable'],

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
        style: { 'background-color': props.background },
        onMouseover: () => { data.hover = props.clickable && true; },
        onMouseout: () => { data.hover = false; },
      }, props.value == -1 ? "" : Vue.h('span', {
        style: { color: data.hover || props.marked ? '#808080' : undefined },
      }, props.value));
    };

  },
}
