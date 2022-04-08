import Vue from '../../vue.js'

import {currentStatus} from '../../data/status.js'

export class UpgradeButtonProps {
  cost: number = 0;
  label?: string = "";
  callback: () => void = () => {};
}

const UpgradeButtonComponent = {
  props: Object.keys(new UpgradeButtonProps()),

  setup(props: UpgradeButtonProps) {
    return () => {
      const cost = Math.round(props.cost);
      return Vue.h('button', {
        onClick: () => {
          currentStatus.spendMoney(cost)
          props.callback();
        },
        disabled: currentStatus.currentMoney < cost,
      }, props.label ? `${props.label} ($${cost})` : `Unlock ($${cost})`);
    }
  }
};

export function makeUpgradButton(props: UpgradeButtonProps, extra = {}) {
  return Vue.h(UpgradeButtonComponent, Object.assign(props, extra));
}
