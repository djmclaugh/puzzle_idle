import Vue from '../vue.js'
// import LoopyInterface from './loopy/loopy_interface.js'
import TowersInterface from './towers/towers_interface.js'
import { towersUpgrades } from '../data/towers/towers_upgrades.js'
import { currentStatus } from '../data/status.js'

interface InterfaceComponentProps {
  puzzleType: string,
}

export default {
  props: ['puzzleType'],
  setup(props: InterfaceComponentProps): any {
    return () => {
      let items = [];

      if (props.puzzleType == 'towers') {
        for (let i = 0; i < towersUpgrades.interfaces.length; ++i) {
          items.push(Vue.h(TowersInterface, {
            key: i,
            interfaceId: i,
          }));
        }
        items.push(Vue.h('button', {
          onClick: () => { towersUpgrades.unlockExtraInterface() },
          disabled: !towersUpgrades.canAffordExtraInterface(),
        }, `Unlock Extra Puzzle Board ($${towersUpgrades.extraInterfaceCost()})`));
      } else if (props.puzzleType == 'loopy') {
        // for (let i = 0; i < currentStatus.interfaces.length; ++i) {
        //   items.push(Vue.h(LoopyInterface, {
        //     key: i,
        //     interfaceId: i,
        //   }));
        // }
      }

      return Vue.h('div', {}, items);
    };
  }
}
