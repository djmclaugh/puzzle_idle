import Vue from '../../vue.js'
import Loopy, {Action} from '../../puzzles/loopy/loopy.js'
import Node from '../../puzzles/loopy/node.js'
import LoopyComponent from './loopy.js'
import InterfaceStatusComponent, {InterfaceHandlers} from '../interface_status.js'
import LabeledCheckbox from './../util/labeled_checkbox.js'

import { currentStatus } from '../../data/status.js'
import { randomOfSize } from '../../puzzles/loopy/loopy_loader.js'
import Process from '../../data/process.js'
import CellEdgeNumberProcess from '../../data/processes/loopy/cell_edge_number_process.js'
import NodeEdgeNumberProcess from '../../data/processes/loopy/node_edge_number_process.js'
import ValidationProcess from '../../data/processes/loopy/validation_process.js'

interface LoopyInterfaceComponentProps {
  interfaceId: number,
  isCurrent: boolean,
}

interface LoopyInterfaceComponentData {
  currentPuzzle: Loopy,
  activeProcesses: Set<Process<any>>,
  autoCellCount: boolean,
  autoNodeCount: boolean,
  autoValidate: boolean,
  autoCashIn: boolean,
  validationProcess: ValidationProcess|null,
}

let puzzleUUID: number = 0;

export default {
  props: ['interfaceId', 'isCurrent'],
  setup(props: LoopyInterfaceComponentProps): any {
    const initialData: LoopyInterfaceComponentData = {
      currentPuzzle: new Loopy([]),
      autoValidate: false,
      autoCashIn: false,
      autoCellCount: true,
      autoNodeCount: true,
      activeProcesses: new Set(),
      validationProcess: null,
    };
    const data: LoopyInterfaceComponentData = Vue.reactive(initialData);

    function size(): number {
      return currentStatus.interfacesCurrentSize[props.interfaceId];
    }

    function stopAllProcesses() {
      data.activeProcesses.forEach(p => currentStatus.cpu.killProcess(p));
      data.activeProcesses.clear();
      if (data.validationProcess) {
        currentStatus.cpu.killProcess(data.validationProcess);
        data.validationProcess = null;
      }
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

        if (data.autoNodeCount) {
          const nodes = Node.fromEdge(a.edgeType, a.row, a.column);
          const p1 = new NodeEdgeNumberProcess(data.currentPuzzle, nodes[0], props.interfaceId);
          if (currentStatus.cpu.addProcess(p1, 9, onProcessOver(p1))) {
            data.activeProcesses.add(p1);
          }
          const p2 = new NodeEdgeNumberProcess(data.currentPuzzle, nodes[1], props.interfaceId);
          if (currentStatus.cpu.addProcess(p2, 9, onProcessOver(p2))) {
            data.activeProcesses.add(p2);
          }
        }

        if (data.autoCellCount) {
          const cells = data.currentPuzzle.getCellsForEdge(a.edgeType, a.row, a.column);
          for (const cell of cells) {
            const p = new CellEdgeNumberProcess(data.currentPuzzle, cell.row, cell.column, props.interfaceId);
            if (currentStatus.cpu.addProcess(p, 9, onProcessOver(p))) {
              data.activeProcesses.add(p);
            }
          }
        }
      });
    }

    async function cashIn() {
      currentStatus.puzzleCompleted(size());
      await assignNewPuzzle()
    }

    function startValidate(): void {
      stopAllProcesses();
      console.log("start validate");
      data.validationProcess = new ValidationProcess(data.currentPuzzle, props.interfaceId);
      data.activeProcesses.add(data.validationProcess);
      currentStatus.cpu.addProcess(data.validationProcess, 10, () => {
        data.activeProcesses.delete(data.validationProcess!);
        if (data.validationProcess!.returnValue && data.autoCashIn) {
          cashIn();
        }
      });
    }

    async function stopValidate() {
      let wasCorrect = false;
      if (data.validationProcess) {
        wasCorrect = data.validationProcess.returnValue;
        data.activeProcesses.delete(data.validationProcess);
        currentStatus.cpu.killProcess(data.validationProcess);
        data.validationProcess = null;
      }
      if (wasCorrect) {
        await cashIn();
      }
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
        guesses: data.currentPuzzle.guesses,
        isValidating: data.validationProcess !== null,
        isDone: data.validationProcess !== null && data.validationProcess.isDone,
        isCorrect: data.validationProcess !== null && data.validationProcess.returnValue,
        puzzle: data.currentPuzzle,
      }
      interfaceProps[InterfaceHandlers.UPGRADE] = async () => {
        currentStatus.upgradeInterface(props.interfaceId);
        await assignNewPuzzle();
      }
      interfaceProps[InterfaceHandlers.RESTART] = restart;
      interfaceProps[InterfaceHandlers.START_VALIDATE] = startValidate;
      interfaceProps[InterfaceHandlers.STOP_VALIDATE] = stopValidate;
      interfaceProps[InterfaceHandlers.UNDO] = () => {
        stopAllProcesses();
        data.currentPuzzle.undo();
      };
      interfaceProps[InterfaceHandlers.ABANDON_GUESS] = () => {
        stopValidate();
        stopAllProcesses();
        data.currentPuzzle.abandonGuess();
      };
      interfaceProps[InterfaceHandlers.MARK_GUESS_AS_IMPOSSIBLE] = () => {
        stopValidate();
        stopAllProcesses();
        data.currentPuzzle.markGuessAsImpossible();
      };
      const interfaceStatus = Vue.h(InterfaceStatusComponent, interfaceProps)
      items.push(interfaceStatus);

      items.push(Vue.h('br'));

      const autoValidate = Vue.h(LabeledCheckbox, {
        value: data.autoValidate,
        label: 'Auto Validate',
        boxId: 'auto_validate_checkbox',
        onChange: (e: Event) => {
          const t: HTMLInputElement = e.target as HTMLInputElement;
          data.autoValidate = t.checked;
        }
      });
      items.push(autoValidate);

      const autoCashIn = Vue.h(LabeledCheckbox, {
        value: data.autoCashIn,
        label: 'Auto Cash In',
        boxId: 'auto_cashin_checkbox',
        onChange: (e: Event) => {
          const t: HTMLInputElement = e.target as HTMLInputElement;
          data.autoCashIn = t.checked;
        }
      });
      items.push(autoCashIn);

      const autoCell = Vue.h(LabeledCheckbox, {
        value: data.autoCellCount,
        label: 'Auto Cell Count (automatically fill in/remove the edges of a cell when only one possibility left)',
        boxId: 'auto_cell_count_checkbox',
        onChange: (e: Event) => {
          const t: HTMLInputElement = e.target as HTMLInputElement;
          data.autoCellCount = t.checked;
        }
      });
      items.push(autoCell);

      const autoNode = Vue.h(LabeledCheckbox, {
        value: data.autoNodeCount,
        label: 'Auto Node Count (automaticlally continue paths and remove dead ends)',
        boxId: 'auto_node_count_checkbox',
        onChange: (e: Event) => {
          const t: HTMLInputElement = e.target as HTMLInputElement;
          data.autoNodeCount = t.checked;
        }
      });
      items.push(autoNode);

      items.push(Vue.h('br'));

      const loopyProps: any = {
        key: 'puzzle-' + puzzleUUID,
        puzzle: data.currentPuzzle,
        interactive: true,
      }
      const p = Vue.h(LoopyComponent, loopyProps);
      items.push(p);

      data.activeProcesses.forEach((p) => {
        const line = Vue.h('p', {}, p.processId);
        items.push(line);
      })

      if (data.validationProcess) {
        for (const log of data.validationProcess.logs) {
          items.push(Vue.h('br'));
          for (const innerLog of log) {
            items.push(Vue.h('br'));
            items.push(innerLog);
          }
        }
      } else {
        // Nothing for now
      }

      return Vue.h('div', {}, items);
    }
  }
}
