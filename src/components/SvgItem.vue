<template>
  <div>
    <svg xmlns="http://www.w3.org/2000/svg" version="1.1">
      <path
        v-for="(path, index) in paths"
        transform="matrix(1.5 0 0 -1.5 0 330)"
        :key="index"
        :stroke="path.stroke ? path.stroke : 'black'"
        :d="path.d"
        @mouseover="showPathData(index,path.d)"
      />
    </svg>
    <div>
      <p>{{data["index"]}}</p>
      <p>{{data["d"]}}</p>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
@Component
export default class SvgItem extends Vue {
  @Prop()
  paths!: { d: string; stroke?: string };
  data:{[key:string]:string}={}
  showPathData(index:number,d:string) {
    this.data={"index":String(index),"d":d}
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
svg {
  width: 400px;
  height: 400px;
  float: left;
  border: 1px solid black;
}
path {
  fill: none;
  stroke-width: 2;
}
path:hover {
  stroke:chartreuse
}
</style>
