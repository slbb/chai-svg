<template>
  <div>
    <SvgItem
      class="panel"
      :is-show-point="isShowPoint"
      :curve-groups="curveGroups"
    />
    <div class="panel">
      <div>
        <input
          type="text"
          name="char"
          id="char"
          maxlength="1"
          v-model.lazy="char"
        />
        <label for="isShowPoint">
          <input
            type="checkbox"
            name="isShowPoint"
            id="isShowPoint"
            v-model="isShowPoint"
          />
          显示点
        </label>
        <button @click="changeStage(0)">还原</button>
        <button @click="changeStage(1)">查找闭合</button>
        <button @click="changeStage(2)">切分相离</button>
        <button @click="changeStage(3)">查找连接</button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, ref } from "vue";
import SvgItem from "./SvgItem.vue";
import data from "@/assets/4E00-9FA5.json";
import { jsonToMap } from "@/svg/utils/jsonToMap";
import {
  parseCurveList,
  toSeparatePart,
  toClosedCurves,
} from "@/svg/run/parser";
import { link } from "@/svg/run/linker";
import { Curve } from "@/svg/struct/Curve";
import { ClosedCurve } from "@/svg/struct/ClosedCurve";
import { SeparatePart } from "@/svg/struct/SeparatePart";

export default defineComponent({
  name: "DebugPanel",
  components: {
    SvgItem,
  },
  setup() {
    const charMap = jsonToMap(data);
    const isShowPoint = ref(true);
    const stageToShow = ref(0);
    function changeStage(stage: number) {
      stageToShow.value = stage;
    }
    const char = ref("粤");
    type CurveGroup = ClosedCurve | SeparatePart;
    type CurveBased = Curve | CurveGroup;
    function displayData(arg: CurveBased[]): Curve[][] {
      if (arg[0] instanceof Curve) {
        return [<Curve[]>arg];
      } else {
        return (<CurveGroup[]>arg).map((v) => v.curves);
      }
    }
    const charCurves = computed(() => parseCurveList(charMap.get(char.value)!));
    const charClosedCurves = computed(() =>
      toClosedCurves(charCurves.value)
    );
    const charSeparateParts = computed(() =>
      toSeparatePart(charClosedCurves.value)
    );
    const charSeparatePartsWithLink = computed(() => {
      let tmp = toSeparatePart(charClosedCurves.value);
      link(tmp);
      return tmp;
    });
    const curveGroups = computed(() => {
      switch (stageToShow.value) {
        case 0:
          return displayData(charCurves.value);
        case 1:
          return displayData(charClosedCurves.value);
        case 2:
          return displayData(charSeparateParts.value);
        case 3:
          return displayData(charSeparatePartsWithLink.value);
        default:
          throw "no such stage";
      }
    });
    return {
      isShowPoint,
      stageToShow,
      changeStage,
      char,
      curveGroups,
    };
  },
});
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.panel {
  float: left;
}
</style>
