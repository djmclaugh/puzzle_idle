import Vue from '../vue.js'
import Towers, {GuessInfo} from '../puzzles/towers/towers.js'
import { currentStatus } from '../data/status.js'

function eventToHandler(event: string): string {
  return 'on' + event[0].toUpperCase() + event.substr(1);
}

function guessToString(g: GuessInfo) {
  return `${g.guess.val + 1} at (${g.guess.col + 1}, ${g.guess.row + 1})`;
}

export enum InterfaceEvents {
  UPGRADE = "upgrade",
  RESTART = "restart",
  UNDO = "undo",
  START_VALIDATE = "start_validate",
  STOP_VALIDATE = "stop_validate",
  ABANDON_GUESS = "abandon_guess",
  MARK_GUESS_AS_IMPOSSIBLE = "mark_guess_as_impossible",
}

export const InterfaceHandlers = {
  UPGRADE: eventToHandler(InterfaceEvents.UPGRADE),
  RESTART: eventToHandler(InterfaceEvents.RESTART),
  UNDO: eventToHandler(InterfaceEvents.UNDO),
  START_VALIDATE: eventToHandler(InterfaceEvents.START_VALIDATE),
  STOP_VALIDATE: eventToHandler(InterfaceEvents.STOP_VALIDATE),
  ABANDON_GUESS: eventToHandler(InterfaceEvents.ABANDON_GUESS),
  MARK_GUESS_AS_IMPOSSIBLE: eventToHandler(InterfaceEvents.MARK_GUESS_AS_IMPOSSIBLE),
}

interface InterfaceStatusComponentProps {
  interfaceId: number,
  guesses: GuessInfo[],
  isValidating: boolean,
  isDone: boolean,
  isCorrect: boolean,
  puzzle: Towers,
}

export default {
  props: ['interfaceId', 'guesses', 'isValidating', 'isDone', 'isCorrect', 'puzzle'],
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
        onClick: () => { emit(InterfaceEvents.UNDO); },
        disabled: !props.puzzle.history || props.puzzle.history.length == 0 || props.isValidating,
      }, 'Undo');
      items.push(undoButton);

      const abandonGuessButton = Vue.h('button', {
        onClick: () => { emit(InterfaceEvents.ABANDON_GUESS); },
        disabled: props.guesses === undefined || props.guesses.length == 0,
      }, 'Abandon Guess');
      items.push(abandonGuessButton);

      const markGuessAsImpossibleButton = Vue.h('button', {
        onClick: () => { emit(InterfaceEvents.MARK_GUESS_AS_IMPOSSIBLE); },
        disabled: props.guesses === undefined || props.guesses.length == 0,
      }, 'Remove Guess');
      items.push(markGuessAsImpossibleButton);

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

      if (props.guesses !== undefined && props.guesses.length > 0) {
        items.push(Vue.h('br'));
        items.push(Vue.h('p', 'Guesses: ' + props.guesses.map(g => guessToString(g)).join(", ")))
      }

      return Vue.h('div', {}, items);
    }
  }
};
