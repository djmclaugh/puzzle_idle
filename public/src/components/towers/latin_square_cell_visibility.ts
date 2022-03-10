import Vue from '../../vue.js'

import {HintFace} from '../../puzzles/towers/hint_face.js'
import {CellVisibilityInfo} from '../../puzzles/towers/cell_visibility_tracker.js'

const thickness = '20%'
const complement = '80%'

interface LatinCellVisibilityComponentProps {
  visibilityInfo: CellVisibilityInfo,
}

export default {
  props: ['visibilityInfo'],

  setup(props: LatinCellVisibilityComponentProps, {emit}: any) {
    function classesForFace(face: HintFace) {
      const seen = props.visibilityInfo[face].seen;
      const hidden = props.visibilityInfo[face].hidden;
      return {
        'cell-visibility-indicator': true,
        'cell-visibility-indicator-seen': seen,
        'cell-visibility-indicator-hidden': hidden,
        'cell-visibility-indicator-contradiction': seen && hidden,
      }
    }

    return () => {
      const north = Vue.h('div', {
        class: classesForFace(HintFace.NORTH),
        style: {
          top: '0px',
          left: thickness,
          right: thickness,
          bottom: complement,
        },
      })
      const west = Vue.h('div', {
        class: classesForFace(HintFace.WEST),
        style: {
          top: thickness,
          left: '0px',
          right: complement,
          bottom: thickness,
        },
      })
      const east = Vue.h('div', {
        class: classesForFace(HintFace.EAST),
        style: {
          top: thickness,
          left: complement,
          right: '0px',
          bottom: thickness,
        },
      })
      const south = Vue.h('div', {
        class: classesForFace(HintFace.SOUTH),
        style: {
          top: complement,
          left: thickness,
          right: thickness,
          bottom: '0px',
        },
      })

      return Vue.h('div', {
        class: ['cell-visibility-indicator-container'],
      }, [north, west, east, south]);
    };
  },
}
