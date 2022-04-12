import Vue from '../../vue.js'

import LabeledCheckbox from './labeled_checkbox.js'

export class CollapsableFieldsetProps {
  label: string = "";
  id: string = "";
  collapsed?: boolean = false;
}

const CollapsableFieldset = {
  props: Object.keys(new CollapsableFieldsetProps()),

  setup(props: CollapsableFieldsetProps, {slots}: any) {
    const collapsed = Vue.ref(false);
    return () => {
      const checkbox = Vue.h(LabeledCheckbox, {
        value: collapsed.value,
        label: props.label,
        boxId: props.id + "_checkbox",
        alternate: ['[+]', '[-]'],
        onChange: (e: InputEvent) => {
          const t = e.target as HTMLInputElement;
          collapsed.value = t.checked;
        }
      });

      if (collapsed.value) {
        return Vue.h('fieldset', {}, [
          Vue.h('legend', {
            style: {
              'padding-left': '0px',
              'padding-right': '0px',
            }
          }, checkbox),
          Vue.h('span', {}, slots),
        ])
      } else {
        return checkbox;
      }
    }
  }
};

export function makeCollapsableFieldset(props: CollapsableFieldsetProps, contents: any) {
  return Vue.h(CollapsableFieldset, props, contents);
}
