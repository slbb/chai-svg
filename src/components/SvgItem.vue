<template>
  <div>
    <svg xmlns="http://www.w3.org/2000/svg" version="1.1">
      <g
        v-for="(group, index) in $store.getters.displayData"
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
          v-show="$store.state.showPoints"
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
      <button @click="test1" :disabled="$store.state.doneStage<2">测试1</button>
      <!-- <button @click="test2">测试2</button> -->
      <p>index:{{ index }}</p>
      <p>data:{{ data }}</p>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { isLinkable, isTwoHeadPointsLinkable } from "../svg/run/linker";
import { Curve } from "../svg/struct/Curve";
@Component
export default class SvgItem extends Vue {
  index = -1;
  data = "";
  colors = ["crimson", "darkviolet", "darkorange", "Fuchsia"];
  selectedc1: Curve | null = null;
  selectedc2: Curve | null = null;
  // selectedp1=-1
  // selectedp2=-1
  selectedGroupIndex: number = -1;
  showPathData(index: number, data: string) {
    this.index = index;
    this.data = data;
  }
  isSelectedPath(curve: Curve): boolean {
    return this.selectedc1 == curve || this.selectedc2 == curve;
  }
  selectPath(curve: Curve, groupIndex: number) {
    if (this.selectedc1 == null) {
      this.selectedc1 = curve;
      this.selectedGroupIndex = groupIndex;
      console.log(curve);
    } else if (this.selectedc2 == null) {
      if (this.selectedGroupIndex != groupIndex) {
        alert("not in same separatePart");
        return;
      }
      this.selectedc2 = curve;
      console.log(curve);
    } else {
      this.selectedc1 = null;
      this.selectedc2 = null;
    }
  }
  test1() {
    if (this.selectedc1 != null && this.selectedc2 != null) {
      console.log(
        isLinkable(
          this.selectedc1,
          this.selectedc2,
          this.$store.state.data[this.selectedGroupIndex]
        )
      );
    }
  }
}
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
