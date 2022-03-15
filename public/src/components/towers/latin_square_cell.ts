import Vue from '../../vue.js'

import LatinSquareCellVisibilityComponent from './latin_square_cell_visibility.js'

import {HintFace} from '../../puzzles/towers/hint_face.js'
import {DirectionalVisibilityInfo} from '../../puzzles/towers/visibility_tracker.js'

interface LatinCellComponentProps {
  possibilities: Set<number>,
  range: number,
  visibilityInfo: DirectionalVisibilityInfo,
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
  props: ['possibilities', 'range', 'visibilityInfo', 'highlight'],

  setup(props: LatinCellComponentProps, {emit}: any) {

    const data: LatinCellComponentData = Vue.reactive({
      p: props.possibilities,
      hover: false,
    });

    function onClick(event: MouseEvent) {
      const target: HTMLDivElement = event.target! as HTMLDivElement;
      const possibility = Number.parseInt(target.textContent!) - 1;
      // if (event.altKey) {
      //   emit('implication', [possibility, event.ctrlKey]);
      // }
      if (event.shiftKey) {
        emit('guess', possibility);
      } else if (event.ctrlKey) {
        emit('remove', possibility);
      } else {
        emit('set', possibility);
      }
    }

    return () => {
      const items = [];

      if (data.p.size == 1) {
        const node = Vue.h('span', {
          class: 'latin-selection',
        }, (data.p.values().next().value + 1).toString());
        items.push(node);
      } else {
        const possibilityNodes = [];
        for (let i = 0; i < props.range; ++i) {
          const style: any[] = [];
          if (data.p.has(i)) {
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
              'crossed-out': !data.p.has(i),
            }],
            style: style,
            key: i.toString(),
            onClick: (e: MouseEvent) => {
              if (data.p.has(i)) {
                onClick(e);
              }
            },
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
          class: 'latin-possibilities',
          style: {
            visibility: data.p.size == 1 && !data.hover ? 'hidden' : 'visible',
          },
        }, possibilityNodes);
        items.push(possibilities);
      }

      items.push(Vue.h(LatinSquareCellVisibilityComponent, {
        visibilityInfo: props.visibilityInfo,
        interactable: false,
        onSetSeen: (face: HintFace) => {
          emit('setSeen', face);
        },
        onSetHidden: (face: HintFace) => {
          emit('setHidden', face);
        },
      }));

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
