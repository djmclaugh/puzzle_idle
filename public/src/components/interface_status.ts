import Vue from '../vue.js'
import Puzzle from '../puzzles/puzzle.js'
import { currentStatus } from '../data/status.js'

function eventToHandler(event: string): string {
  return 'on' + event[0].toUpperCase() + event.substr(1);
}

export enum InterfaceEvents {
  RESTART = "restart",
  UNDO = "undo",
  START_VALIDATE = "start_validate",
  STOP_VALIDATE = "stop_validate",
  ABANDON_GUESS = "abandon_guess",
  MARK_GUESS_AS_IMPOSSIBLE = "mark_guess_as_impossible",
}

export const InterfaceHandlers = {
  RESTART: eventToHandler(InterfaceEvents.RESTART),
  UNDO: eventToHandler(InterfaceEvents.UNDO),
  START_VALIDATE: eventToHandler(InterfaceEvents.START_VALIDATE),
  STOP_VALIDATE: eventToHandler(InterfaceEvents.STOP_VALIDATE),
  ABANDON_GUESS: eventToHandler(InterfaceEvents.ABANDON_GUESS),
  MARK_GUESS_AS_IMPOSSIBLE: eventToHandler(InterfaceEvents.MARK_GUESS_AS_IMPOSSIBLE),
}

interface InterfaceStatusComponentProps {
  undoUnlocked: boolean,
  guessUnlocked: boolean,
  interfaceId: number,
  isValidating: boolean,
  isDone: boolean,
  isCorrect: boolean,
  size: number,
  puzzle: Puzzle<any>,
}

export default {
  props: ['undoUnlocked', 'guessUnlocked', 'interfaceId', 'isValidating', 'isDone', 'isCorrect', 'size', 'puzzle'],
  setup(props: InterfaceStatusComponentProps, {attrs, slots, emit}: any): any {

    return () => {
      if (!(props.puzzle instanceof Puzzle)) {
        return Vue.h('div');
      }
      let items = [];

      const restartButton = Vue.h('button', {
        onClick: () => { emit(InterfaceEvents.RESTART); },
        disabled: props.isValidating || props.puzzle.history.length == 0,
      }, 'Restart');
      items.push(restartButton);

      if (props.undoUnlocked) {
        const undoButton = Vue.h('button', {
          onClick: () => { emit(InterfaceEvents.UNDO); },
          disabled: !props.puzzle.history || props.puzzle.history.length == 0 || props.isValidating,
        }, 'Undo');
        items.push(undoButton);
      }

      if (props.guessUnlocked) {
        const abandonGuessButton = Vue.h('button', {
          onClick: () => { emit(InterfaceEvents.ABANDON_GUESS); },
          disabled: props.puzzle.guesses === undefined || props.puzzle.guesses.length == 0,
        }, 'Undo Last Guess');
        items.push(abandonGuessButton);

        const markGuessAsImpossibleButton = Vue.h('button', {
          onClick: () => { emit(InterfaceEvents.MARK_GUESS_AS_IMPOSSIBLE); },
          disabled: props.puzzle.guesses === undefined || props.puzzle.guesses.length == 0,
        }, 'Mark Last Guess As Impossible');
        items.push(markGuessAsImpossibleButton);
      }

      const checkButton = Vue.h('button', {
        onClick: () => { emit(InterfaceEvents.START_VALIDATE); },
        disabled: !(props.puzzle instanceof Puzzle) || props.isValidating || !props.puzzle.isReadyForValidation(),
      }, 'Validate');
      items.push(checkButton);

      if (props.isValidating) {
        let message = props.isDone ? (props.isCorrect ? `Cash In (+$${currentStatus.puzzleReward(props.size)})` : 'Return to edit mode') : 'Cancel';
        const stopButton = Vue.h('button', {
          onClick: () => { emit(InterfaceEvents.STOP_VALIDATE); },
        }, message);
        items.push(stopButton);
      }

      if (props.guessUnlocked && props.puzzle.guesses !== undefined && props.puzzle.guesses.length > 0) {
        items.push(Vue.h('br'));
        const guessStrings = props.puzzle.guesses.map(g => props.puzzle.history[g].toString());
        items.push(Vue.h('p', 'Guesses: ' + guessStrings.join(", ")));
      }

      return Vue.h('div', {}, items);
    }
  }
};
