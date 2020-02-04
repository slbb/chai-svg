<template>
  <div>
    <svg
      xmlns="http://www.w3.org/2000/svg"
      version="1.1"
      viewbox="0 0 256 256"
    >
      <path
        v-for="(path, index) in paths" :key="index"
        transform="matrix(1 0 0 -1 0 220)"
        fill="none"
        :stroke="path.stroke"
        stroke-width="2"
        :d="path.d"
      />
    </svg>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
@Component
export default class SvgItem extends Vue {
  @Prop ()
  paths!: object[]
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
</style>
