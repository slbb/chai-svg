<template>
  <div>
    <svg xmlns="http://www.w3.org/2000/svg" version="1.1">
      <g
        v-for="(group, index) in curveGroups"
        :key="'group' + index"
      >
        <path
          v-for="(curve, index2) in group"
          :class="{ selectedPath: isSelectedPath(curve) }"
          transform="matrix(3 0 0 -3 0 650)"
          :key="index + '.' + index2"
          :stroke="colors[index % 4]"
          :d="curve.toPathString()"
          @mouseover="showPathData(index2, curve.toString())"
          @click="selectPath(curve, index)"
        />
        <circle
          v-show="isShowPoint"
          v-for="(curve, index) in group"
          transform="matrix(3 0 0 -3 0 650)"
          :key="'Point' + index"
          :cx="curve.start.x"
          :cy="curve.start.y"
          r="1"
          @mouseover="showPathData(index, curve.start.toString())"
        />
        <!-- @click="$emit('select-point',index)" -->
      </g>
    </svg>
    <div class="data">
      <!-- <button @click="test1" :disabled="$store.state.doneStage<2">测试1</button> -->
      <!-- <button @click="test2">测试2</button> -->
      <p>index:{{ curveIndex }}</p>
      <p>data:{{ curvePathString }}</p>
    </div>
  </div>
</template>

<script lang="ts">
import { Curve } from '@/svg/struct/Curve';
import { defineComponent, PropType, reactive, ref } from 'vue';

export default defineComponent({
  name: 'SvgItem',
  props: {
    curveGroups: {
      type: Object as PropType<Curve[][]>,
      required: true
    },
    isShowPoint: {
      type: Boolean,
      required: true
    },
  },
  setup() {
    const colors = ["crimson", "darkviolet", "darkorange", "Fuchsia"];
    const selectedCurves: Curve[] = reactive([])
    function selectPath(curve: Curve) {
      let index = selectedCurves.indexOf(curve)
      if(index < 0){
        selectedCurves.push(curve)
      }else{
        selectedCurves.splice(index, 1)
      }
    }
    const curveIndex = ref(-1)
    const curvePathString = ref("")
    function showPathData(index: number, pathString: string) {
      curveIndex.value = index
      curvePathString.value = pathString
    }
    function isSelectedPath(curve: Curve): boolean {
      return selectedCurves.indexOf(curve) > -1
    }
    return {
      colors,
      selectedCurves,
      selectPath,
      showPathData,
      isSelectedPath,
      curveIndex,
      curvePathString
    }
  }
})
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
svg {
  width: 750px;
  height: 750px;
  border: 1px solid black;
}
.data {
  width: 750px;
}
path {
  fill: none;
  stroke-width: 2;
}
path:hover {
  stroke: chartreuse;
}
circle {
  fill: black;
}
circle:hover {
  fill: lightblue;
}
.selectedPath {
  stroke: gray;
}
.selectedPoint {
  fill: green;
}
</style>
