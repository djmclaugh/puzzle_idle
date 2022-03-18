import Vue from '../../vue.js'

import {HintFace} from '../../puzzles/towers/hint_face.js'
import {DirectionalVisibilityInfo} from '../../puzzles/towers/visibility_tracker.js'

const thickness = '16%'
const complement = '84%'

interface LatinCellVisibilityComponentProps {
  visibilityInfo: DirectionalVisibilityInfo,
  facesToSkip: HintFace[],
  interactable: boolean,
}

type HoverData = {
  [key in HintFace]: boolean;
};

export default {
  props: ['visibilityInfo', 'facesToSkip', 'interactable'],

  setup(props: LatinCellVisibilityComponentProps, {emit}: any) {

    const hoverData: HoverData = Vue.reactive({
      [HintFace.NORTH]: false,
      [HintFace.WEST]: false,
      [HintFace.EAST]: false,
      [HintFace.SOUTH]: false,
    });

    function classesForFace(face: HintFace) {
      const seen = props.visibilityInfo[face].seen;
      const hidden = props.visibilityInfo[face].hidden;
      const skipped = props.facesToSkip.indexOf(face) != -1;
      return {
        'cell-visibility-indicator': true,
        'cell-visibility-indicator-hover': !skipped && hoverData[face],
        'cell-visibility-indicator-seen': !skipped && seen,
        'cell-visibility-indicator-hidden': !skipped && hidden,
        'cell-visibility-indicator-contradiction': !skipped && seen && hidden,
      }
    }

    function onMouseover(face: HintFace) {
      return () => {
        if (props.interactable && !props.visibilityInfo[face].hidden && !props.visibilityInfo[face].seen) {
          hoverData[face] = true;
        }
      }
    }

    function onMouseout(face: HintFace) {
      return () => {
        if (props.interactable && !props.visibilityInfo[face].hidden && !props.visibilityInfo[face].seen) {
          hoverData[face] = false;
        }
      }
    }

    function onClick(face: HintFace) {
      return (event: MouseEvent) => {
        hoverData[face] = false;
        if (!props.interactable) {
          return;
        }
        if (event.ctrlKey) {
          emit('setHidden', face);
        } else {
          emit('setSeen', face);
        }
      }
    }

    return () => {
      let face = HintFace.NORTH
      const north = Vue.h('div', {
        style: {
          top: '0px',
          left: thickness,
          right: thickness,
          bottom: complement,
        },
        class: classesForFace(face),
        onMouseover: onMouseover(face),
        onMouseout: onMouseout(face),
        onClick: onClick(face),
      })

      face = HintFace.WEST
      const west = Vue.h('div', {
        style: {
          top: thickness,
          left: '0px',
          right: complement,
          bottom: thickness,
        },
        class: classesForFace(face),
        onMouseover: onMouseover(face),
        onMouseout: onMouseout(face),
        onClick: onClick(face),
      })

      face = HintFace.EAST
      const east = Vue.h('div', {
        style: {
          top: thickness,
          left: complement,
          right: '0px',
          bottom: thickness,
        },
        class: classesForFace(face),
        onMouseover: onMouseover(face),
        onMouseout: onMouseout(face),
        onClick: onClick(face),
      })

      face = HintFace.SOUTH
      const south = Vue.h('div', {
        style: {
          top: complement,
          left: thickness,
          right: thickness,
          bottom: '0px',
        },
        class: classesForFace(face),
        onMouseover: onMouseover(face),
        onMouseout: onMouseout(face),
        onClick: onClick(face),
      })

      return Vue.h('div', {
        class: ['cell-visibility-indicator-container'],
      }, [north, west, east, south]);
    };
  },
}
