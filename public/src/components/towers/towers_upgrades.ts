import Vue from '../../vue.js'

import { currentCPU } from '../../data/cpu.js'
import { towersUpgrades } from '../../data/towers/towers_upgrades.js'

export default {
  setup() {
    return () => {
      let items = [];

      const convenienceItems = [
        Vue.h('legend', {}, 'Convenience'),
      ];

      let button = Vue.h('button', {
        onClick: () => { towersUpgrades.unlockAutoValidate(); },
        disabled: !towersUpgrades.canAffordAutoValidate(),
      }, `Unlock ($${towersUpgrades.autoValidateCost})`);
      if (currentCPU.cores > 0) {
        convenienceItems.push(Vue.h('div', [
          Vue.h('strong', {}, 'Auto Validate'),
          `: Automatically start the validation process once each cell has a value. `,
          towersUpgrades.autoValidateUnlocked ? Vue.h('em', {}, '(Unlocked)') : button,
        ]));
      }

      button = Vue.h('button', {
        onClick: () => { towersUpgrades.unlockAutoCashIn(); },
        disabled: !towersUpgrades.canAffordAutoCashIn(),
      }, `Unlock ($${towersUpgrades.autoCashInCost})`)
      if (currentCPU.cores > 0) {
        convenienceItems.push(Vue.h('div', {hidden: currentCPU.cores == 0}, [
          Vue.h('strong', {}, 'Auto Cash In'),
          `: Automatically cash in on sucessful validation. `,
          towersUpgrades.autoCashInUnlocked ? Vue.h('em', {}, '(Unlocked)') : button,
        ]));
      }

      button = Vue.h('button', {
        onClick: () => { towersUpgrades.unlockAutoRevertOnContradiction(); },
        disabled: !towersUpgrades.canAffordAutoRevertOnContradiction(),
      }, `Unlock ($${towersUpgrades.autoRevertOnContradictionCost})`)
      if (currentCPU.cores > 0) {
        convenienceItems.push(Vue.h('div', {hidden: currentCPU.cores == 0}, [
          Vue.h('strong', {}, 'Auto Revert On Contradiction'),
          `: Automatically restarts if a contradiciton is noticed. `,
          towersUpgrades.autoRevertOnContradictionUnlocked ? Vue.h('em', {}, '(Unlocked)') : button,
        ]));
      }

      if (convenienceItems.length > 1) {
        items.push(Vue.h('fieldset', {}, convenienceItems));
      }

      const abilitiesItems = [
        Vue.h('legend', {}, 'Abilities'),
      ];

      button = Vue.h('button', {
        onClick: () => { towersUpgrades.unlockRemovePossibility(); },
        disabled: !towersUpgrades.canAffordRemovePossibility(),
      }, `Unlock ($${towersUpgrades.removePossibilityCost})`)
      if (towersUpgrades.interfaces[0] > 2) {
        abilitiesItems.push(Vue.h('div', {}, [
          Vue.h('strong', {}, 'Possibility Removal'),
          `: Control-click to mark a possibility as impossible. `,
          towersUpgrades.removePossibilityUnlocked ? Vue.h('em', {}, '(Unlocked)') : button,
        ]));
      }

      button = Vue.h('button', {
        onClick: () => { towersUpgrades.unlockUndo(); },
        disabled: !towersUpgrades.canAffordUndo(),
      }, `Unlock ($${towersUpgrades.undoCost})`)
      if (towersUpgrades.interfaces[0] > 3) {
        abilitiesItems.push(Vue.h('div', {}, [
          Vue.h('strong', {}, 'Undo'),
          `: Let's you undo one move at a time instead of restarting from the begining. `,
          towersUpgrades.undoUnlocked ? Vue.h('em', {}, '(Unlocked)') : button,
        ]));
      }

      button = Vue.h('button', {
        onClick: () => { towersUpgrades.unlockGuess(); },
        disabled: !towersUpgrades.canAffordGuess(),
      }, `Unlock ($${towersUpgrades.guessCost})`)
      if (towersUpgrades.removePossibilityUnlocked && towersUpgrades.undoUnlocked && towersUpgrades.interfaces[0] > 4) {
        abilitiesItems.push(Vue.h('div', {}, [
          Vue.h('strong', {}, 'Guessing'),
          `: Shift-click to make a guess. Reverting undoes the latest guess instead of restarting. `,
          towersUpgrades.guessUnlocked ? Vue.h('em', {}, '(Unlocked)') : button,
        ]));
      }

      if (abilitiesItems.length > 1) {
        items.push(Vue.h('fieldset', {}, abilitiesItems));
      }

      const processesItems = [
        Vue.h('legend', {}, 'Processes'),
      ];

      button = Vue.h('button', {
        onClick: () => { towersUpgrades.unlockRandomGuessProcess(); },
        disabled: !towersUpgrades.canAffordRandomGuessProcess(),
      }, `Unlock ($${towersUpgrades.randomGuessProcessCost})`)
      if (currentCPU.cores > 0) {
        processesItems.push(Vue.h('div', {hidden: currentCPU.cores == 0}, [
          Vue.h('strong', {}, 'Random Guess Process'),
          `: Makes a random guesse if no other proccesses are running on the puzzle. `,
          towersUpgrades.randomGuessProcessUnlocked ? Vue.h('em', {}, '(Unlocked)') : button,
        ]));
      }

      button = Vue.h('button', {
        onClick: () => { towersUpgrades.unlockRemoveFromColumnRowProcess(); },
        disabled: !towersUpgrades.canAffordRemoveFromColumnRowProcess(),
      }, `Unlock ($${towersUpgrades.removeFromColumnRowProcessCost})`)
      if (towersUpgrades.removePossibilityUnlocked) {
        processesItems.push(Vue.h('div', [
          Vue.h('strong', {}, 'Remove From Row/Column Process'),
          `: When a cell is set, remove that possibility from the other cells in that row/column. `,
          towersUpgrades.removeFromColumnRowProcessUnlocked ? Vue.h('em', {}, '(Unlocked)') : button,
        ]));
      }

      button = Vue.h('button', {
        onClick: () => { towersUpgrades.unlockSimpleViewProcess(); },
        disabled: !towersUpgrades.canAffordSimpleViewProcess(),
      }, `Unlock ($${towersUpgrades.simpleViewProcessCost})`)
      if (towersUpgrades.removePossibilityUnlocked) {
        processesItems.push(Vue.h('div', [
          Vue.h('strong', {}, 'Simple View Process'),
          `: Remove possibilites that would block the view too soon. `,
          towersUpgrades.simpleViewProcessUnlocked ? Vue.h('em', {}, '(Unlocked)') : button,
        ]));
      }

      if (processesItems.length > 1) {
        items.push(Vue.h('fieldset', {}, processesItems));
      }

      return Vue.h('details', {open: true, hidden: items.length == 0}, [
        Vue.h('summary', {}, "Puzzle Upgrades"),
        Vue.h('div', {}, items),
      ]);
    }
  }

}
