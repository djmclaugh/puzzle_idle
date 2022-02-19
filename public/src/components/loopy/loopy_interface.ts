import Vue from '../../vue.js'
import Loopy, {Action} from '../../puzzles/loopy/loopy.js'
import Node from '../../puzzles/loopy/node.js'
import LoopyComponent from './loopy.js'
import InterfaceStatusComponent, {InterfaceHandlers} from '../interface_status.js'
import { currentStatus } from '../../data/status.js'
import { randomOfSize } from '../../puzzles/loopy/loopy_loader.js'
import Process from '../../data/process.js'
import CellEdgeNumberProcess from '../../data/processes/loopy/cell_edge_number_process.js'
import NodeEdgeNumberProcess from '../../data/processes/loopy/node_edge_number_process.js'

interface LoopyInterfaceComponentProps {
  interfaceId: number,
  isCurrent: boolean,
}

interface LoopyInterfaceComponentData {
  currentPuzzle: Loopy,
  activeProcesses: Set<Process<any>>,
}

let puzzleUUID: number = 0;

export default {
  props: ['interfaceId', 'isCurrent'],
  setup(props: LoopyInterfaceComponentProps): any {
    const data: LoopyInterfaceComponentData = Vue.reactive({
      currentPuzzle: {},
      activeProcesses: new Set(),
    });

    function size(): number {
      return currentStatus.interfacesCurrentSize[props.interfaceId];
    }

    function stopAllProcesses() {
      data.activeProcesses.forEach(p => currentStatus.cpu.killProcess(p));
      data.activeProcesses.clear();
    }

    function onProcessOver<R>(process: Process<R>) {
      return () => {
        data.activeProcesses.delete(process);
      }
    }

    function restart(): void {
      stopAllProcesses()
      data.currentPuzzle.restart();
    }

    async function assignNewPuzzle() {
      stopAllProcesses();
      data.currentPuzzle = await randomOfSize(size());
      puzzleUUID += 1;

      data.currentPuzzle.onAction((a: Action) => {
        if (data.currentPuzzle.hasContradiction()) {
          // Then no need to make further inferences
          stopAllProcesses();
          return;
        }
        const nodes = Node.fromEdge(a.edgeType, a.row, a.column);
        const p1 = new NodeEdgeNumberProcess(data.currentPuzzle, nodes[0], props.interfaceId);
        if (currentStatus.cpu.addProcess(p1, 9, onProcessOver(p1))) {
          data.activeProcesses.add(p1);
        }
        const p2 = new NodeEdgeNumberProcess(data.currentPuzzle, nodes[1], props.interfaceId);
        if (currentStatus.cpu.addProcess(p2, 9, onProcessOver(p2))) {
          data.activeProcesses.add(p2);
        }

        const cells = data.currentPuzzle.getCellsForEdge(a.edgeType, a.row, a.column);
        for (const cell of cells) {
          const p = new CellEdgeNumberProcess(data.currentPuzzle, cell.row, cell.column, props.interfaceId);
          if (currentStatus.cpu.addProcess(p, 9, onProcessOver(p))) {
            data.activeProcesses.add(p);
          }
        }
      });
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
      interfaceProps[InterfaceHandlers.UNDO] = () => {
        stopAllProcesses();
        data.currentPuzzle.undo();
      };
      interfaceProps[InterfaceHandlers.ABANDON_GUESS] = () => {
        data.currentPuzzle.abandonGuess();
      };
      interfaceProps[InterfaceHandlers.MARK_GUESS_AS_IMPOSSIBLE] = () => {
        data.currentPuzzle.markGuessAsImpossible();
      };
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
