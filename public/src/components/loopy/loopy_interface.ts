import Vue from '../../vue.js'
import Loopy from '../../puzzles/loopy/loopy.js'
import LoopyComponent from './loopy.js'
import InterfaceStatusComponent, {InterfaceHandlers} from '../interface_status.js'
import { currentStatus } from '../../data/status.js'
import { randomOfSize } from '../../puzzles/loopy/loopy_loader.js'

interface LoopyInterfaceComponentProps {
  interfaceId: number,
  isCurrent: boolean,
}

interface LoopyInterfaceComponentData {
  currentPuzzle: Loopy
}

let puzzleUUID: number = 0;

export default {
  props: ['interfaceId', 'isCurrent'],
  setup(props: LoopyInterfaceComponentProps): any {
    const data: LoopyInterfaceComponentData = Vue.reactive({
      currentPuzzle: {},
    });

    function size(): number {
      return 5;
      // return currentStatus.interfacesCurrentSize[props.interfaceId];
    }

    function restart(): void {
      data.currentPuzzle.restart();
    }

    async function assignNewPuzzle() {
      data.currentPuzzle = await randomOfSize(size());
      puzzleUUID += 1;
    }

    Vue.onMounted(async () => {
      await assignNewPuzzle();
    })

    return () => {
      if (!props.isCurrent) {
        return Vue.h('div', {hidden: true});
      }
      let items = [];

      const interfaceProps: any = {
        interfaceId: props.interfaceId,
        guesses: [],
        isValidating: false,
        isDone: false,
        isCorrect: false,
        puzzle: data.currentPuzzle,
      }
      interfaceProps[InterfaceHandlers.UPGRADE] = async () => {
        currentStatus.upgradeInterface(props.interfaceId);
        await assignNewPuzzle();
      }
      interfaceProps[InterfaceHandlers.RESTART] = restart;
      interfaceProps[InterfaceHandlers.START_VALIDATE] = () => {};
      interfaceProps[InterfaceHandlers.STOP_VALIDATE] = () => {};
      interfaceProps[InterfaceHandlers.UNDO] = () => {};
      interfaceProps[InterfaceHandlers.ABANDON_GUESS] = () => {};
      interfaceProps[InterfaceHandlers.MARK_GUESS_AS_IMPOSSIBLE] = () => {};
      const interfaceStatus = Vue.h(InterfaceStatusComponent, interfaceProps)
      items.push(interfaceStatus);

      const loopyProps: any = {
        key: 'puzzle-' + puzzleUUID,
        puzzle: data.currentPuzzle,
        interactive: true,
      }
      const p = Vue.h(LoopyComponent, loopyProps);
      items.push(p);

      return Vue.h('div', {}, items);
    }
  }
}
