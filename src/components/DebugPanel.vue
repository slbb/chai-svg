<template>
  <div>
    <SvgItem class="panel" />
    <div class="panel">
      <div>
        <input
          type="text"
          name="char"
          id="char"
          maxlength="1"
          v-model.lazy="char"
        />
        <label for="showPoints">
          <input
            type="checkbox"
            name="showPoints"
            id="showPoints"
            v-model="showPoints"
          />
          显示点
        </label>
        <button @click="clear(char)">还原</button>
        <button @click="run(1)" :disabled="$store.state.doneStage > 0">
          查找闭合
        </button>
        <button @click="run(2)" :disabled="$store.state.doneStage > 1">
          切分相离
        </button>
        <button @click="run(3)" :disabled="$store.state.doneStage > 2">
          查找连接
        </button>
      </div>
      <!-- <div v-is="$store.state.doneStage == 2">
        <button @click="selectElement(-1)">显示全部</button>
        <button
          v-for="(index) in $store.state.displayGroups"
          :key="'sp' + index"
          @click="selectElement(index)"
        >
          部件{{ index }}
        </button>
      </div> -->
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import SvgItem from "./SvgItem.vue";

@Component({
  components: {
    SvgItem
  }
})
export default class DebugView extends Vue {
  get char() {
    return this.$store.state.char;
  }
  set char(char: string) {
    this.$store.commit("updateChar", char);
  }
  get showPoints() {
    return this.$store.state.showPoints;
  }
  set showPoints(showPoints: boolean) {
    this.$store.commit("switchShowPoints", showPoints);
  }
  run(stage: number) {
    this.$store.commit("run", stage);
  }
  clear() {
    this.$store.commit("updateChar", this.char);
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.panel {
  float: left;
}
</style>
