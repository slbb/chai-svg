<template>
  <div class="hello">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      version="1.1"
      viewbox="0 0 256 256"
    >
      <path
        transform="matrix(1 0 0 -1 0 220)"
        fill="none"
        stroke="black"
        stroke-width="2"
        d="M24 17L25 46"
      />
    </svg>
    <svg
      xmlns="http://www.w3.org/2000/svg"
      version="1.1"
      viewbox="0 0 256 256"
      v-for="(path, index) in paths"
      :key="index"
    >
      <path
        transform="matrix(1 0 0 -1 0 220)"
        fill="none"
        stroke="black"
        stroke-width="2"
        :d="path"
      />
    </svg>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { pathToCurveList, curveListToPath } from "../svg/convert";
import {
  findClosedCurves,
  generateCharacterSeparatePart,
  displayCharacterWithSeparateParts
} from "../svg/handle";
import { Point } from "../svg/curve";

@Component
export default class HelloWorld extends Vue {
  msg: string =
    "M39 55Q39 42 40 24L24 17Q25 46 25 100.50Q25 155 24 174L47 164L39 157L39 55M67-26Q68-1 68 16L68 179Q68 193 67 209L92 198L82 191L82 16Q82-2 83-18L67-26M153 190Q143 170 137 159L204 159L217 172L236 153L135 153Q114 115 92 97L89 99Q124 144 140 209L163 195L153 190M145 142Q170 132 181.50 125Q193 118 193 109Q193 106 191 99.50Q189 93 187 93Q184 93 178 103Q169 118 143 139L145 142M225 75Q225 2 226-15L211-22L211 1L126 1L126-18L111-24Q112-8 112 34.50Q112 77 111 94L126 85L209 85L218 95L234 81L225 75M126 79L126 7L161 7L161 79L126 79M175 79L175 7L211 7L211 79L175 79Z";
  paths: string[] = [];
  created() {
    // this.paths=displayCharacterWithSeparateParts(generateCharacterSeparatePart(findClosedCurves(pathToCurveList(this.msg))))
    let sp = generateCharacterSeparatePart(findClosedCurves(pathToCurveList(this.msg)))
    let m = displayCharacterWithSeparateParts(sp)
    for (let i of m) {
      this.paths.push(i);
    }
  }
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
