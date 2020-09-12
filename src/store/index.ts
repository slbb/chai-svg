import Vue from 'vue'
import Vuex, { mapActions } from 'vuex'
import charMap from '@/view/charMap'
import { Coordinate } from '@/svg/struct/Coordinate'
import {
  parseCurveList,
  toSeparatePart,
  toClosedCurves,
} from '@/svg/run/parser'
import { Curve } from '@/svg/struct/Curve'
import { SeparatePart } from '@/svg/struct/SeparatePart'
import { ClosedCurve } from '@/svg/struct/ClosedCurve'
import { Point } from '@/svg/struct/Point'
import { link } from '@/svg/run/linker'
type CurveGroup = ClosedCurve | SeparatePart
type CurveBased = Curve | CurveGroup
const initChar = '粤'
let initData: CurveBased[] = parseCurveList(charMap.get(initChar)!)
function procedureRunner(stage: number, arg: CurveBased[]) {
  switch (stage) {
    case 1:
      return toClosedCurves(<Curve[]>arg)
    case 2:
      return toSeparatePart(<ClosedCurve[]>arg)
    case 3:
      link(<SeparatePart[]>arg)
      return arg
    default:
      throw 'no such stage'
  }
}

Vue.use(Vuex)
export default new Vuex.Store({
  state: {
    char: initChar,
    data: initData,
    showPoints: true,
    doneStage: 0,
    select: -1,
  },
  getters: {
    displayData(state): Curve[][] {
      if (state.data[0] instanceof Curve) {
        return [<Curve[]>state.data]
      } else {
        return (<CurveGroup[]>state.data).map((v) => v.curves)
      }
    },
  },
  mutations: {
    updateChar(state, char) {
      state.char = char
      state.data = parseCurveList(charMap.get(char)!)
      state.doneStage = 0
    },
    switchShowPoints(state, showPoints) {
      state.showPoints = showPoints
    },
    run(state, stage) {
      let stopAt = stage + 1
      let tmp = state.data
      for (let i = state.doneStage + 1; i < stopAt; i++) {
        tmp = procedureRunner(i, tmp)
      }
      state.data = tmp
      state.doneStage = stage
    },
    // selectElement(state,index){
    //   if(index==-1){
    //     state.data=dataGroups
    //   }else{
    //     state.data=dataGroups.slice(index,index+1)
    //   }
    // },
  },
  actions: {},
  modules: {},
})
