import Vue from '../../vue.js'

import LabeledCheckbox from '../util/labeled_checkbox.js'
import {makeCollapsableFieldset} from '../util/collapsable_fieldset.js'
import { makePuzzleSizeInput } from './puzzle_size_input.js'

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

      const puzzleSize = makePuzzleSizeInput({
        interfaceId: props.interfaceId,
        options: props.options,
        onChange: () => { emit('sizeChange'); },
      });
      items.push(puzzleSize);

      const optionsItems: any = [];

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

      const showPuzzleId = Vue.h(LabeledCheckbox, {
        value: props.options.showPuzzleId,
        label: 'Show Puzzle ID',
        boxId: 'show_puzzle_id_' + props.interfaceId,
        onChange: (e: Event) => {
          const t: HTMLInputElement = e.target as HTMLInputElement;
          props.options.showPuzzleId = t.checked;
        }
      });
      optionsItems.push(showPuzzleId);

      items.push(makeCollapsableFieldset({
        label: 'Options',
        id: 'interface_options_' + props.interfaceId,
      }, () => optionsItems));


      // Processes settings
      const processesItems: any = [];

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
        label: towersUpgrades.removeFromColumnRowProcess.isUnlocked ? 'Remove Set Value From Row/Column' : 'Last Cell In Row/Column',
        boxId: 'auto_remove_on_set_checkbox_' + props.interfaceId,
        onChange: (e: Event) => {
          const t: HTMLInputElement = e.target as HTMLInputElement;
          props.options.removeOnSetOn = t.checked;
          if (props.options.removeOnSetOn) {
            emit("removeOnSetOn");
          }
        }
      });
      if (towersUpgrades.lastCellLeftProcess.isUnlocked) {
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

      if (processesItems.length > 0) {
        items.push(makeCollapsableFieldset({
          label: 'Routines',
          id: 'processes_interface_options_' + props.interfaceId,
        }, () => processesItems));
      }

      return Vue.h('div', {}, items);
    };
  }
}
