import Vue from '../../vue.js'

import { towersUpgrades } from '../../data/towers/towers_upgrades.js'
import TowersOptions from '../../data/towers/towers_options.js'
import {currentStatus} from '../../data/status.js'
import {currentPower} from '../../data/power.js'
import {currentCPU} from '../../data/cpu.js'

interface PuzzleSizeInputProps {
  interfaceId: number,
  options: TowersOptions,
  [other: string]: any,
}

export function makePuzzleSizeInput(p: PuzzleSizeInputProps) {
  return Vue.h(PuzzleSizeInputComponent, p);
}

export const PuzzleSizeInputComponent = {
  props: ['interfaceId', 'options'],
  emits: ['change'],
  setup(props: PuzzleSizeInputProps, {emit}:any ): any {
    return () => {

      const minSize = 2;
      const maxSize = towersUpgrades.interfaces[props.interfaceId];
      const options = [];

      for (let i = minSize; i <= maxSize; ++i) {
        options.push(Vue.h('option', {value: i}, i + ` ($${Math.pow(i, 2*i - 4)} reward)`));
      }
      let i = maxSize + 1;
      options.push(Vue.h('option', {value: i, disabled: true}, i + ` ($${Math.pow(i, 2*i - 4)} reward)`));

      const shouldShow = currentStatus.allTimeMoney >= 3 || (currentPower.crankLevel >= 1 && currentCPU.maxSpeed > 1);
      const puzzleSize = Vue.h('div', {
        style: {
          display: shouldShow ? 'inline-block' : 'none',
          'padding': '4px',
        }
      }, [
        Vue.h('label', {}, Vue.h('strong', {}, 'Puzzle Size: ')),
        Vue.h('select', {
          id: 'puzzle_size_input',
          value: props.options.currentSize,
          onChange: (e: InputEvent) => {
            const t = e.target as HTMLSelectElement;
            const v = parseInt(t.value);
            if (v === undefined || v < minSize || v > maxSize) {
              t.value = props.options.currentSize.toString();
            } else if (props.options.currentSize != v){
              props.options.currentSize = v;
              emit('change');
            }
          }
        }, options),
        " ",
        Vue.h('button', {
          onClick: () => {
            towersUpgrades.upgradeSize(props.interfaceId);
          },
          disabled: !towersUpgrades.canAffordSizeUpgrade(props.interfaceId),
        }, `Unlock Size ${maxSize + 1} Puzzles ($${towersUpgrades.sizeUpgradeCost(props.interfaceId)})`),
      ]);

      return puzzleSize;
    };
  }
}
