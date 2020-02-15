<template>
  <div>
    <svg xmlns="http://www.w3.org/2000/svg" version="1.1">
      <path
        v-for="(path, index) in paths"
        transform="matrix(1 0 0 -1 0 220)"
        :key="index"
        :stroke="path.stroke?path.stroke:'black'"
        :d="path.d"
      />
    </svg>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
@Component
export default class SvgItem extends Vue {
  @Prop()
  paths!:{d:string,stroke?:string}
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
svg {
  width: 256px;
  height: 256px;
  float: left;
  border: 1px solid black;
}
path {
  fill: none;
  stroke-width: 2;
}
</style>
