import Vue from '../../vue.js'

import LabeledCheckbox from './../util/labeled_checkbox.js'

import { towersUpgrades } from '../../data/towers/towers_upgrades.js'
import TowersOptions from '../../data/towers/towers_options.js'

interface TowersOptionsProps {
  interfaceId: number,
  options: TowersOptions,
}

export default {
  props: ['interfaceId', 'options'],
  setup(props: TowersOptionsProps, {emit}:any ): any {
    return () => {
      let items = [];

      const minSize = 2;
      const maxSize = towersUpgrades.interfaces[props.interfaceId];

      const puzzleSize = Vue.h('div', {
        style: {
          display: 'inline-block',
          'padding': '4px',
        }
      }, [
        Vue.h('label', {for: 'puzzle_size_input'}, Vue.h('strong', {}, 'Puzzle Size: ')),
        Vue.h('input', {
          id: 'puzzle_size_input',
          style: {
            width: '2.5em',
          },
          type: 'number',
          value: props.options.currentSize,
          min: minSize,
          max: maxSize,
          onChange: (e: InputEvent) => {
            const t = e.target as HTMLInputElement;
            const v = parseInt(t.value);
            if (v === undefined || v < minSize || v > maxSize) {
              t.value = props.options.currentSize.toString();
            } else if (props.options.currentSize != v){
              props.options.currentSize = v;
              emit('sizeChange');
            }
          }
        }),
        Vue.h('button', {
          onClick: (e: InputEvent) => {
            towersUpgrades.upgradeSize(props.interfaceId);
          },
          disabled: !towersUpgrades.canAffordSizeUpgrade(props.interfaceId),
        }, `Unlock Size ${maxSize + 1} Puzzles ($${towersUpgrades.sizeUpgradeCost(props.interfaceId)})`),
      ]);
      items.push(puzzleSize);

      const optionsItems = [
        Vue.h('legend', {}, 'Options'),
      ];

      const autoValidate = Vue.h(LabeledCheckbox, {
        value: props.options.autoValidateOn,
        label: 'Auto Validate',
        boxId: 'auto_validate_checkbox_' + props.interfaceId,
        onChange: (e: Event) => {
          const t: HTMLInputElement = e.target as HTMLInputElement;
          props.options.autoValidateOn = t.checked;
        }
      });
      if (towersUpgrades.autoValidateUnlocked) {
        optionsItems.push(autoValidate);
      }

      const autoCashIn = Vue.h(LabeledCheckbox, {
        value: props.options.autoCashInOn,
        label: 'Auto Cash In',
        boxId: 'auto_cash_in_checkbox_' + props.interfaceId,
        onChange: (e: Event) => {
          const t: HTMLInputElement = e.target as HTMLInputElement;
          props.options.autoCashInOn = t.checked;
        }
      });
      if (towersUpgrades.autoCashInUnlocked) {
        optionsItems.push(autoCashIn);
      }

      const autoRevertOnContradiction = Vue.h(LabeledCheckbox, {
        value: props.options.autoRevertOnContradiction,
        label: 'Auto Revert On Contradiction',
        boxId: 'auto_revert_on_contradiction_checkbox_' + props.interfaceId,
        onChange: (e: Event) => {
          const t: HTMLInputElement = e.target as HTMLInputElement;
          props.options.autoRevertOnContradiction = t.checked;
        }
      });
      if (towersUpgrades.autoRevertOnContradictionUnlocked) {
        optionsItems.push(autoRevertOnContradiction);
      }

      const showValidation = Vue.h(LabeledCheckbox, {
        value: props.options.showValidation,
        label: 'Show Details During Validation',
        boxId: 'show_validation_' + props.interfaceId,
        onChange: (e: Event) => {
          const t: HTMLInputElement = e.target as HTMLInputElement;
          props.options.showValidation = t.checked;
        }
      });
      optionsItems.push(showValidation);

      items.push(Vue.h('fieldset', {
        style: {
          display: 'flex',
          'flex-wrap': 'wrap',
        }
      }, optionsItems));


      // Processes settings
      const processesItems = [
        Vue.h('legend', {}, 'Processes To Run'),
      ];
      const autoRandom = Vue.h(LabeledCheckbox, {
        value: props.options.randomGuessOn,
        label: 'Random Guess',
        boxId: 'auto_random_checkbox_' + props.interfaceId,
        onChange: (e: Event) => {
          const t: HTMLInputElement = e.target as HTMLInputElement;
          props.options.randomGuessOn = t.checked;
          if (props.options.randomGuessOn) {
            emit("randomGuessOn");
          }
        }
      });
      if (towersUpgrades.randomGuessProcessUnlocked) {
        processesItems.push(autoRandom);
      }

      const autoRemoveOnSet = Vue.h(LabeledCheckbox, {
        value: props.options.removeOnSetOn,
        label: 'Remove Set Value From Row/Column',
        boxId: 'auto_remove_on_set_checkbox_' + props.interfaceId,
        onChange: (e: Event) => {
          const t: HTMLInputElement = e.target as HTMLInputElement;
          props.options.removeOnSetOn = t.checked;
          if (props.options.removeOnSetOn) {
            emit("removeOnSetOn");
          }
        }
      });
      if (towersUpgrades.removeFromColumnRowProcessUnlocked) {
        processesItems.push(autoRemoveOnSet);
      }

      const simpleView = Vue.h(LabeledCheckbox, {
        value: props.options.simpleViewOn,
        label: 'Simple View',
        boxId: 'simple_view_checkbox_' + props.interfaceId,
        onChange: (e: Event) => {
          const t: HTMLInputElement = e.target as HTMLInputElement;
          props.options.simpleViewOn = t.checked;
        }
      });
      if (towersUpgrades.simpleViewProcessUnlocked) {
        processesItems.push(simpleView);
      }

      if (processesItems.length > 1) {
        items.push(Vue.h('fieldset', {
          style: {
            display: 'flex',
            'flex-wrap': 'wrap',
          }
        }, processesItems));
      }

      return Vue.h('div', {}, items);
    };
  }
}
