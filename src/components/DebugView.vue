<template>
  <div>
    <input type="text" name="char" id="char" v-model.lazy="char"/>
    <SvgItem :paths.sync="operation" />
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import SvgItem from "./SvgItem.vue";
import { pathToCurveList } from "../svg/convert";
import {
  findClosedCurves,
  generateSeparatePart,
  findLines
} from "../svg/handle";
import { Line } from "../svg/class";
import { PathElement, SvgUtil } from "../svg/svgDisplay";
import data from "../assets/4E00-9FA5.json";
const charMap = new Map<string,string>();
for (let entries of Object.entries(data)) {
  let [k,v] = entries
  if(v&&typeof v == 'string'){
    charMap.set(k,v)
  }
}

@Component({
  components: {
    SvgItem
  }
})
export default class DebugView extends Vue {
  char = "劙";
  strokeColorRef = {
    0: "yellow",
    1: "red",
    2: "blue",
    3: "green",
    4: "orange",
    5: "pink",
    6: "lightgreen",
    7: "purple",
    8: "lightblue"
  };
  get operation() {
    let pathTmp = charMap.get(this.char)
    let path:string = pathTmp?pathTmp:''
    let sps = generateSeparatePart(
      findClosedCurves(pathToCurveList(path))
    );
    let ne: PathElement[] = [];
    for (let sp of sps) {
      let lines = findLines(sp.getCurveList());
      ne = ne.concat(
        SvgUtil.array2pathElementsColored(lines, this.strokeColorRef)
      );
    }
    return ne;
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

</style>
