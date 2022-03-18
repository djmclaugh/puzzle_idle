import Vue from '../vue.js'
import { currentStatus } from '../data/status.js'
import { towersUpgrades } from '../data/towers/towers_upgrades.js'

export default {
  setup() {
    return () => {
      let items = [];
      items.push(Vue.h('p', {}, [
        `Current money: $${currentStatus.money}`,
        ' ',
        Vue.h('button', {onClick: () => {currentStatus.money += 10;}}, 'Give me $10'),
        ' ',
        Vue.h('button', {onClick: () => {currentStatus.money += 1000;}}, 'Give me $1000'),
        ' ',
        Vue.h('button', {
          onClick: () => {
              const m = currentStatus.money;

              towersUpgrades.autoCashIn.unlock();
              towersUpgrades.autoRevertOnContradiction.unlock();
              towersUpgrades.autoValidate.unlock();
              towersUpgrades.betterSimpleViewProcess.unlock();
              towersUpgrades.guess.unlock();
              towersUpgrades.markHintSatisfied.unlock();
              towersUpgrades.maxViewProcess.unlock();
              towersUpgrades.notOneViewProcess.unlock();
              towersUpgrades.oneViewProcess.unlock();
              towersUpgrades.onlyChoiceInColumnRowProcess.unlock();
              towersUpgrades.visibility.unlock();
              towersUpgrades.detectVisibilityProcess.unlock();
              towersUpgrades.removeContradictoryVisibilityProcess.unlock();
              towersUpgrades.cellVisibilityCountProcess.unlock();
              towersUpgrades.heightVisibilityCountProcess.unlock();
              towersUpgrades.randomGuessProcess.unlock();
              towersUpgrades.removeFromColumnRowProcess.unlock();
              towersUpgrades.removePossibility.unlock();
              towersUpgrades.simpleViewProcess.unlock();
              towersUpgrades.undo.unlock();

              currentStatus.money = m;
          }
        }, 'Unlock All'),
      ]));


      //
      // items.push(Vue.h('p', {}, [
      //   `Number of Interfaces: ${currentStatus.interfaces.length} `,
      //   Vue.h('button', {
      //     onClick: () => {
      //       currentStatus.upgradeNumberOfInterfaces();
      //     },
      //     disabled: !currentStatus.canAffordNumberOfInterfacesUpgrade(),
      //   }, `Upgrade ($${currentStatus.numberOfInterfacesUpgradeCost})`)
      // ]));

      return Vue.h('div', {}, items);
    }
  }

}
