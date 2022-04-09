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
          onClick: () => {
            towersUpgrades.upgradeSize(props.interfaceId);
          },
          disabled: !towersUpgrades.canAffordSizeUpgrade(props.interfaceId),
        }, `Unlock Size ${maxSize + 1} Puzzles ($${towersUpgrades.sizeUpgradeCost(props.interfaceId)})`),
        Vue.h('span', {}, " Solving a puzzle of size 𝑛 pays out $𝑛"),
        Vue.h('sup', {}, "(2𝑛 - 4)"),
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
      if (towersUpgrades.autoValidate.isUnlocked) {
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
      if (towersUpgrades.autoCashIn.isUnlocked) {
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
      if (towersUpgrades.autoRevertOnContradiction.isUnlocked) {
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
        Vue.h('legend', {}, 'Processes'),
      ];

      const onStartItems = [
        Vue.h('legend', {}, 'Trigger After Puzzle Start'),
      ];

      const onPossibilityRemovedItems = [
        Vue.h('legend', {}, 'Trigger After Possibility Removal'),
      ];

      const onPossibilitySetItems = [
        Vue.h('legend', {}, 'Trigger After Possibility Set'),
      ];

      const onVisibilityChangedItems = [
        Vue.h('legend', {}, 'Trigger After Visibility Change'),
      ];

      const onStuckItems = [
        Vue.h('legend', {}, 'Trigger After All Other Processes Completed'),
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
      if (towersUpgrades.randomGuessProcess.isUnlocked) {
        onStuckItems.push(autoRandom);
      }

      const onlyInRowColumn = Vue.h(LabeledCheckbox, {
        value: props.options.onlyInRowColumnOn,
        label: 'Only Choice In Row/Column',
        boxId: 'only_in_row_column_checkbox_' + props.interfaceId,
        onChange: (e: Event) => {
          const t: HTMLInputElement = e.target as HTMLInputElement;
          props.options.onlyInRowColumnOn = t.checked;
        }
      });
      if (towersUpgrades.onlyChoiceInColumnRowProcess.isUnlocked) {
        onPossibilityRemovedItems.push(onlyInRowColumn);
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
      if (towersUpgrades.removeFromColumnRowProcess.isUnlocked) {
        onPossibilitySetItems.push(autoRemoveOnSet);
      }

      if (towersUpgrades.removeContradictoryVisibilityProcess.isUnlocked) {
        const removeContradictoryVisibilityOn = Vue.h(LabeledCheckbox, {
          value: props.options.removeContradictoryVisibilityOn,
          label: 'Remove Contradictory Visibility',
          boxId: 'remove_contradictory_visibility_checkbox_' + props.interfaceId,
          onChange: (e: Event) => {
            const t: HTMLInputElement = e.target as HTMLInputElement;
            props.options.removeContradictoryVisibilityOn = t.checked;
          }
        });
        onVisibilityChangedItems.push(removeContradictoryVisibilityOn);
      }

      if (towersUpgrades.detectVisibilityProcess.isUnlocked) {
        const detectVisibilityOn = Vue.h(LabeledCheckbox, {
          value: props.options.detectVisibilityOn,
          label: 'Detect Visibility',
          boxId: 'detect_visibility_checkbox_' + props.interfaceId,
          onChange: (e: Event) => {
            const t: HTMLInputElement = e.target as HTMLInputElement;
            props.options.detectVisibilityOn = t.checked;
          }
        });
        onPossibilityRemovedItems.push(detectVisibilityOn);
      }

      if (towersUpgrades.cellVisibilityCountProcess.isUnlocked) {
        const cellVisibilityCountOn = Vue.h(LabeledCheckbox, {
          value: props.options.cellVisibilityCountOn,
          label: 'Cell Visibility Count',
          boxId: 'cell_visibility_count_checkbox_' + props.interfaceId,
          onChange: (e: Event) => {
            const t: HTMLInputElement = e.target as HTMLInputElement;
            props.options.cellVisibilityCountOn = t.checked;
          }
        });
        onVisibilityChangedItems.push(cellVisibilityCountOn);
      }

      if (towersUpgrades.cellMustBeSeenProcess.isUnlocked) {
        const cellMustBeSeenOn = Vue.h(LabeledCheckbox, {
          value: props.options.cellMustBeSeenOn,
          label: 'Cell Must Be Seen',
          boxId: 'cell_must_be_seen_checkbox_' + props.interfaceId,
          onChange: (e: Event) => {
            const t: HTMLInputElement = e.target as HTMLInputElement;
            props.options.cellMustBeSeenOn = t.checked;
          }
        });
        onVisibilityChangedItems.push(cellMustBeSeenOn);
      }

      if (towersUpgrades.cellMustBeHiddenProcess.isUnlocked) {
        const cellMustBeHiddenOn = Vue.h(LabeledCheckbox, {
          value: props.options.cellMustBeHiddenOn,
          label: 'Cell Must Be Hidden',
          boxId: 'cell_must_be_hidden_checkbox_' + props.interfaceId,
          onChange: (e: Event) => {
            const t: HTMLInputElement = e.target as HTMLInputElement;
            props.options.cellMustBeHiddenOn = t.checked;
          }
        });
        onVisibilityChangedItems.push(cellMustBeHiddenOn);
      }

      if (towersUpgrades.heightVisibilityCountProcess.isUnlocked) {
        const heightVisibilityCountOn = Vue.h(LabeledCheckbox, {
          value: props.options.heightVisibilityCountOn,
          label: 'Height Visibility Count',
          boxId: 'height_visibility_count_checkbox_' + props.interfaceId,
          onChange: (e: Event) => {
            const t: HTMLInputElement = e.target as HTMLInputElement;
            props.options.heightVisibilityCountOn = t.checked;
          }
        });
        onVisibilityChangedItems.push(heightVisibilityCountOn);
      }

      if (towersUpgrades.heightMustBeSeenProcess.isUnlocked) {
        const heightMustBeSeenOn = Vue.h(LabeledCheckbox, {
          value: props.options.heightMustBeSeenOn,
          label: 'Height Must Be Seen',
          boxId: 'height_must_be_seen_checkbox_' + props.interfaceId,
          onChange: (e: Event) => {
            const t: HTMLInputElement = e.target as HTMLInputElement;
            props.options.heightMustBeSeenOn = t.checked;
          }
        });
        onVisibilityChangedItems.push(heightMustBeSeenOn);
      }

      if (towersUpgrades.heightMustBeHiddenProcess.isUnlocked) {
        const heightMustBeHiddenOn = Vue.h(LabeledCheckbox, {
          value: props.options.heightMustBeHiddenOn,
          label: 'Height Must Be Hidden',
          boxId: 'height_must_be_hidden_checkbox_' + props.interfaceId,
          onChange: (e: Event) => {
            const t: HTMLInputElement = e.target as HTMLInputElement;
            props.options.heightMustBeHiddenOn = t.checked;
          }
        });
        onVisibilityChangedItems.push(heightMustBeHiddenOn);
      }

      const oneView = Vue.h(LabeledCheckbox, {
        value: props.options.oneViewOn,
        label: '1 View',
        boxId: 'one_view_checkbox_' + props.interfaceId,
        onChange: (e: Event) => {
          const t: HTMLInputElement = e.target as HTMLInputElement;
          props.options.oneViewOn = t.checked;
        }
      });
      if (towersUpgrades.oneViewProcess.isUnlocked && !towersUpgrades.simpleViewProcess.isUnlocked) {
        onStartItems.push(oneView);
      }

      const notOneView = Vue.h(LabeledCheckbox, {
        value: props.options.notOneViewOn,
        label: 'Not 1 View',
        boxId: 'not_one_view_checkbox_' + props.interfaceId,
        onChange: (e: Event) => {
          const t: HTMLInputElement = e.target as HTMLInputElement;
          props.options.notOneViewOn = t.checked;
        }
      });
      if (towersUpgrades.notOneViewProcess.isUnlocked && !towersUpgrades.simpleViewProcess.isUnlocked) {
        onStartItems.push(notOneView);
      }

      const maxView = Vue.h(LabeledCheckbox, {
        value: props.options.maxViewOn,
        label: 'Max View',
        boxId: 'max_view_checkbox_' + props.interfaceId,
        onChange: (e: Event) => {
          const t: HTMLInputElement = e.target as HTMLInputElement;
          props.options.maxViewOn = t.checked;
        }
      });
      if (towersUpgrades.maxViewProcess.isUnlocked && !towersUpgrades.simpleViewProcess.isUnlocked) {
        onStartItems.push(maxView);
      }

      const simpleView = Vue.h(LabeledCheckbox, {
        value: props.options.simpleViewOn,
        label: 'Initial View',
        boxId: 'simple_view_checkbox_' + props.interfaceId,
        onChange: (e: Event) => {
          const t: HTMLInputElement = e.target as HTMLInputElement;
          props.options.simpleViewOn = t.checked;
        }
      });
      if (towersUpgrades.simpleViewProcess.isUnlocked) {
        onStartItems.push(simpleView);
      }


      const style = {
        display: 'flex',
        'flex-wrap': 'wrap',
      };
      if (onStartItems.length > 1) {
        processesItems.push(Vue.h('fieldset', {style}, onStartItems));
      }
      if (onPossibilityRemovedItems.length > 1) {
        processesItems.push(Vue.h('fieldset', {style}, onPossibilityRemovedItems));
      }
      if (onPossibilitySetItems.length > 1) {
        processesItems.push(Vue.h('fieldset', {style}, onPossibilitySetItems));
      }
      if (onVisibilityChangedItems.length > 1) {
        processesItems.push(Vue.h('fieldset', {style}, onVisibilityChangedItems));
      }
      if (onStuckItems.length > 1) {
        processesItems.push(Vue.h('fieldset', {style}, onStuckItems));
      }

      if (processesItems.length > 1) {
        items.push(Vue.h('fieldset', {}, processesItems));
      }

      return Vue.h('div', {}, items);
    };
  }
}
