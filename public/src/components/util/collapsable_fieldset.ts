import Vue from '../../vue.js'

import LabeledCheckbox from './labeled_checkbox.js'

export class CollapsableFieldsetProps {
  label: string = "";
  id: string = "";
  collapsed?: boolean = true;
}

const CollapsableFieldset = {
  props: Object.keys(new CollapsableFieldsetProps()),

  setup(props: CollapsableFieldsetProps, {slots}: any) {
    const collapsed = Vue.ref(props.collapsed !== false);
    return () => {
      const style: any = {};
      if (collapsed.value) {
        style['margin-top'] = '8px';
        style['margin-bottom'] = '8px';
      }
      const checkbox = Vue.h(LabeledCheckbox, {
        value: collapsed.value,
        label: props.label,
        boxId: props.id + "_checkbox",
        alternate: ['[−]', '[+]'],
        style,
        onChange: (e: InputEvent) => {
          const t = e.target as HTMLInputElement;
          collapsed.value = t.checked;
        }
      });

      if (collapsed.value) {
        return checkbox;
      } else {
        return Vue.h('fieldset', {}, [
          Vue.h('legend', {
            style: {
              'padding-left': '0px',
              'padding-right': '0px',
            }
          }, checkbox),
          Vue.h('slot', {}, slots),
        ])
      }
    }
  }
};

export function makeCollapsableFieldset(props: CollapsableFieldsetProps, contents: any) {
  return Vue.h(CollapsableFieldset, props, contents);
}
