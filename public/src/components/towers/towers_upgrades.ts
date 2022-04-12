import Vue from '../../vue.js'

import LabeledCheckbox from '../util/labeled_checkbox.js'

import { UnlockableUpgrade, towersUpgrades } from '../../data/towers/towers_upgrades.js'
import { currentStatus } from '../../data/status.js'

export default {
  setup() {
    const showUnlocked = Vue.ref(false);

    function shouldShowUpgrade(u: UnlockableUpgrade): boolean {
      return (!u.isUnlocked || showUnlocked.value) && u.isAvailable();
    }

    function upgradeToElement(u: UnlockableUpgrade) {
      let button = Vue.h('button', {
        onClick: () => { u.unlock(); },
        disabled: !u.canAfford,
      }, `Unlock ($${u.cost})`);
      return Vue.h('div', { style: {margin: '8px'}}, [
        Vue.h('strong', {}, u.name),
        ': ',
        u.description,
        ' ',
        u.isUnlocked ? Vue.h('em', {}, '(Unlocked)') : button,
      ]);
    }

    return () => {
      let items = [];

      let availableUpgrades = 0;
      let affordableUpgrades = 0;

      const checkbox = Vue.h(LabeledCheckbox, {
        style: {
          display: 'inline-block',
        },
        value: showUnlocked.value,
        label: 'Show Already Purchased Upgrades',
        boxId: 'show_unclocked_checkbox',
        onChange: (e: Event) => {
          const t: HTMLInputElement = e.target as HTMLInputElement;
          showUnlocked.value = t.checked;
        }
      });
      items.push(checkbox);

      const convenienceItems = [Vue.h('legend', {}, 'Convenience')];
      for (const upgrade of [
        towersUpgrades.autoValidate,
        towersUpgrades.autoCashIn,
        towersUpgrades.autoRevertOnContradiction,
      ]) {
        if (shouldShowUpgrade(upgrade)) {
          convenienceItems.push(upgradeToElement(upgrade));
          if (!upgrade.isUnlocked) {
            availableUpgrades += 1;
            if (upgrade.canAfford) {
              affordableUpgrades += 1;
            }
          }
        }
      }
      if (convenienceItems.length > 1) {
        items.push(Vue.h('fieldset', {}, convenienceItems));
      }


      const abilitiesItems = [Vue.h('legend', {}, 'Abilities')];
      for (const upgrade of [
        towersUpgrades.removePossibility,
        towersUpgrades.undo,
        towersUpgrades.visibility,
        towersUpgrades.markHintSatisfied,
        towersUpgrades.guess,
      ]) {
        if (shouldShowUpgrade(upgrade)) {
          abilitiesItems.push(upgradeToElement(upgrade));
          if (!upgrade.isUnlocked) {
            availableUpgrades += 1;
            if (upgrade.canAfford) {
              affordableUpgrades += 1;
            }
          }
        }
      }
      if (abilitiesItems.length > 1) {
        items.push(Vue.h('fieldset', {}, abilitiesItems));
      }

      const processesItems = [Vue.h('legend', {}, 'Routines')];
      for (const upgrade of [
        towersUpgrades.onlyChoiceInColumnRowProcess,
        towersUpgrades.removeFromColumnRowProcess,
        towersUpgrades.detectVisibilityProcess,
        towersUpgrades.cellVisibilityCountProcess,
        towersUpgrades.cellMustBeSeenProcess,
        towersUpgrades.cellMustBeHiddenProcess,
        towersUpgrades.heightVisibilityCountProcess,
        towersUpgrades.heightMustBeSeenProcess,
        towersUpgrades.heightMustBeHiddenProcess,
        towersUpgrades.removeContradictoryVisibilityProcess,
        towersUpgrades.maxViewProcess,
        towersUpgrades.oneViewProcess,
        towersUpgrades.notOneViewProcess,
        towersUpgrades.simpleViewProcess,
        towersUpgrades.betterSimpleViewProcess,
        towersUpgrades.tooShortTooFarUpgrade,
        towersUpgrades.twosViewUpgrade,
        towersUpgrades.randomGuessProcess,
      ]) {
        if (shouldShowUpgrade(upgrade)) {
          processesItems.push(upgradeToElement(upgrade));
          if (!upgrade.isUnlocked) {
            availableUpgrades += 1;
            if (upgrade.canAfford) {
              affordableUpgrades += 1;
            }
          }
        }
      }
      if (processesItems.length > 1) {
        items.push(Vue.h('fieldset', {}, processesItems));
      }

      if (items.length == 1) {
        items.push(Vue.h('br'));
        items.push(Vue.h('em', {
          style: {
            'display': 'block',
            'text-align': 'center',
          }
        }, 'No new upgrades currently available.'));
      }

      return Vue.h('details', {
        open: true,
        hidden: currentStatus.allTimeMoney < 3,
      }, [
        Vue.h('summary', {}, [
          Vue.h('strong', {style: {display: 'inline-block'}}, `Puzzle Upgrades`),
          ' | ',
          Vue.h('span', {style: {display: 'inline-block'}}, `${availableUpgrades} new`),
          ' | ',
          Vue.h('span', {style: {display: 'inline-block'}}, `${affordableUpgrades} affordable`),
        ]),
        Vue.h('div', {}, items),
      ]);
    }
  }

}
