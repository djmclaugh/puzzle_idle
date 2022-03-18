import Vue from '../../vue.js'

import LatinSquareCellVisibilityComponent from './latin_square_cell_visibility.js'

import VisibilityTracker from '../../puzzles/towers/visibility_tracker.js'
import {HintFace} from '../../puzzles/towers/hint_face.js'

interface LatinCellComponentProps {
  row: number,
  col: number,
  possibilities: Set<number>,
  facesToSkip: HintFace[],
  range: number,
  visibilityTracker: VisibilityTracker,
  highlight: {
    red: Set<number>,
    yellow: Set<number>,
    green: Set<number>,
  },
}

interface LatinCellComponentData {
  hover: boolean,
}

export default {
  props: ['row', 'col', 'possibilities', 'facesToSkip', 'range', 'visibilityTracker', 'highlight'],

  setup(props: LatinCellComponentProps, {emit}: any) {

    const data: LatinCellComponentData = Vue.reactive({
      hover: false,
    });

    function onClick(event: MouseEvent, i: number) {
      // if (event.altKey) {
      //   emit('implication', [possibility, event.ctrlKey]);
      // }
      if (event.shiftKey) {
        emit('guess', i);
      } else if (event.ctrlKey) {
        emit('remove', i);
      } else {
        emit('set', i);
      }
    }

    return () => {
      const items = [];

      if (props.possibilities.size == 1) {
        const p = props.possibilities.values().next().value;
        const node = Vue.h('span', {
          class: 'latin-selection',
        }, (p + 1).toString());
        items.push(node);
        items.push(Vue.h(LatinSquareCellVisibilityComponent, {
          visibilityInfo: props.visibilityTracker.getWithTriple({
            row: props.row, col: props.col, val: p
          }),
          facesToSkip: props.facesToSkip,
          interactable: false,
        }));
      } else {
        const possibilityNodes = [];
        for (let i = 0; i < props.range; ++i) {
          const style: any[] = [];
          if (props.possibilities.has(i)) {
            if (data.hover && props.highlight.yellow.has(i)) {
              style.push({backgroundColor: "#ffffe0"});
            }
            if (data.hover && props.highlight.red.has(i)) {
              if (props.highlight.green.has(i)) {
                style.push({backgroundColor: "#303030"});
              } else {
                style.push({backgroundColor: "#e0c0c0"});
              }
            } else if (data.hover && props.highlight.green.has(i)) {
              style.push({backgroundColor: "#c0e0c0"});
            }

          }
          const node = Vue.h('div', {
            class: ['latin-possibility', {
              'crossed-out': !props.possibilities.has(i),
            }],
            style: style,
            key: i.toString(),
            onClick: (e: MouseEvent) => {
              if (props.possibilities.has(i)) {
                onClick(e, i);
              }
            },
            onMouseover: () => {
              if (props.possibilities.has(i)) {
                emit('updateHighlight', i);
              }
            },
            onMouseout: () => { emit('updateHighlight', undefined); },
          }, [(i+1).toString(), Vue.h(LatinSquareCellVisibilityComponent, {
            interactable: false,
            facesToSkip: props.facesToSkip,
            visibilityInfo: props.visibilityTracker.getWithTriple({
              row: props.row, col: props.col, val: i
            }),
          })]);
          possibilityNodes.push(node);
        }

        const possibilities = Vue.h('div', {
          class: 'latin-possibilities',
          style: {
            visibility: props.possibilities.size == 1 && !data.hover ? 'hidden' : 'visible',
          },
        }, possibilityNodes);
        items.push(possibilities);
      }

      return Vue.h('div', {
        class: ['latin-cell'],
        onMouseover: () => {data.hover = true;},
        onMouseout: () => {
          data.hover = false;
        },
      }, items);
    };
  },
}
