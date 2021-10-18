import Vue from '../vue.js'
import Towers from '../puzzles/towers/towers.js'
import { currentStatus } from '../data/status.js'

function eventToHandler(event: string): string {
  return 'on' + event[0].toUpperCase() + event.substr(1);
}

export enum InterfaceEvents {
  UPGRADE = "upgrade",
  RESTART = "restart",
  UNDO = "undo",
  START_VALIDATE = "start_validate",
  STOP_VALIDATE = "stop_validate",
}

export const InterfaceHandlers = {
  UPGRADE: eventToHandler(InterfaceEvents.UPGRADE),
  RESTART: eventToHandler(InterfaceEvents.RESTART),
  UNDO: eventToHandler(InterfaceEvents.UNDO),
  START_VALIDATE: eventToHandler(InterfaceEvents.START_VALIDATE),
  STOP_VALIDATE: eventToHandler(InterfaceEvents.STOP_VALIDATE),
}

interface InterfaceStatusComponentProps {
  interfaceId: number,
  isValidating: boolean,
  isDone: boolean,
  isCorrect: boolean,
  puzzle: Towers,
}

export default {
  props: ['interfaceId', 'isCurrent', 'isValidating', 'isDone', 'isCorrect', 'puzzle'],
  setup(props: InterfaceStatusComponentProps, {attrs, slots, emit}: any): any {
    function size(): number {
      return currentStatus.interfacesCurrentSize[props.interfaceId];
    }

    return () => {
      let items = [];

      const upgradeButton = Vue.h('button', {
        onClick: async () => {
          emit(InterfaceEvents.UPGRADE);
        },
        disabled: props.isValidating || !currentStatus.canAffordInterfaceUpgrade(props.interfaceId)
      }, `Upgrade ($${currentStatus.interfaceUpgradeCost(props.interfaceId)})`);
      items.push(upgradeButton);

      const restartButton = Vue.h('button', {
        onClick: () => { emit(InterfaceEvents.RESTART); },
        disabled: props.isValidating,
      }, 'Restart');
      items.push(restartButton);

      const undoButton = Vue.h('button', {
        onClick: () => { props.puzzle.undo(); },
        disabled: !props.puzzle.history || props.puzzle.history.length == 0 || props.isValidating,
      }, 'Undo');
      items.push(undoButton);

      const checkButton = Vue.h('button', {
        onClick: () => { emit(InterfaceEvents.START_VALIDATE); },
        disabled: !(props.puzzle instanceof Towers) || props.isValidating || !props.puzzle.isReadyForValidation,
      }, 'Validate');
      items.push(checkButton);

      if (props.isValidating) {
        let message = props.isDone ? (props.isCorrect ? `Cash In (+$${currentStatus.puzzleReward(size())})` : 'Return to edit mode') : 'Cancel';
        const stopButton = Vue.h('button', {
          onClick: () => { emit(InterfaceEvents.STOP_VALIDATE); },
        }, message);
        items.push(stopButton);
      }

      return Vue.h('div', {}, items);
    }
  }
};
