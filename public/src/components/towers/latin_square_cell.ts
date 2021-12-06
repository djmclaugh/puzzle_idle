import Vue from '../../vue.js'

interface LatinCellComponentProps {
  possibilities: Set<number>,
  range: number,
  highlight: {
    red: Set<number>,
    yellow: Set<number>,
    green: Set<number>,
  },
}

interface LatinCellComponentData {
  p: Set<number>,
  hover: boolean,
}

export default {
  props: ['possibilities', 'range', 'highlight'],

  setup(props: LatinCellComponentProps, {attrs, slots, emit}: any) {

    const data: LatinCellComponentData = Vue.reactive({
      p: props.possibilities,
      hover: false,
    });

    function onClick(event: MouseEvent) {
      const target: HTMLDivElement = event.target! as HTMLDivElement;
      const possibility = Number.parseInt(target.textContent!) - 1;
      if (event.altKey) {
        emit('implication', [possibility, event.ctrlKey]);
      } else if (event.shiftKey) {
        // Make guess
        emit('guess', possibility);
      } else if (event.ctrlKey) {
        // Toggle this possibility
        if (data.p.has(possibility)) {
          emit('remove', possibility);
        } else {
          emit('add', possibility);
        }
      } else {
        // Make this the only possibility
        emit('set', possibility);
      }
    }

    return () => {
      const items = [];

      if (data.p.size == 1) {
        const node = Vue.h('span', {
          class: 'sudoku-selection',
          style: {
            opacity: data.hover && (props.range > 0) ? 0.5 : 1,
          },
        }, (data.p.values().next().value + 1).toString());
        items.push(node);
      }

      const possibilityNodes = [];
      for (let i = 0; i < props.range; ++i) {
        const style: any[] = [];
        if (data.p.has(i)) {
          if (props.highlight.yellow.has(i)) {
            style.push({backgroundColor: "#ffffe0"});
          }
          if (props.highlight.red.has(i)) {
            if (props.highlight.green.has(i)) {
              style.push({backgroundColor: "#303030"});
            } else {
              style.push({backgroundColor: "#e0c0c0"});
            }
          } else if (props.highlight.green.has(i)) {
            style.push({backgroundColor: "#c0e0c0"});
          }

        }
        const node = Vue.h('div', {
          class: ['sudoku-possibility', {
            'crossed-out': !data.p.has(i),
          }],
          style: style,
          key: i.toString(),
          onClick: onClick,
          onMouseover: () => {
            if (data.p.has(i)) {
              emit('updateHighlight', i);
            }
          },
          onMouseout: () => { emit('updateHighlight', undefined); },
        }, (i+1).toString());
        possibilityNodes.push(node);
      }
      const possibilities = Vue.h('div', {
        class: 'sudoku-possibilities',
        style: {
          visibility: data.p.size == 1 && !data.hover ? 'hidden' : 'visible',
        },
      }, possibilityNodes);
      items.push(possibilities);

      return Vue.h('div', {
        class: ['sudoku-cell'],
        onMouseover: () => {data.hover = true;},
        onMouseout: () => {
          data.hover = false;
        },
      }, items);
    };
  },
}
