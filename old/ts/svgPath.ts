import { pathToCharaterWithCurve } from "./convert"
import { Curve, Point } from "./curve"

const s:string = '<glyph glyph-name="uni4E34" unicode="&#x4E34;" d="M39 55Q39 42 40 24L24 17Q25 46 25 100.50Q25 155 24 174L47 164L39 157L39 55M67-26Q68-1 68 16L68 179Q68 193 67 209L92 198L82 191L82 16Q82-2 83-18L67-26M153 190Q143 170 137 159L204 159L217 172L236 153L135 153Q114 115 92 97L89 99Q124 144 140 209L163 195L153 190M145 142Q170 132 181.50 125Q193 118 193 109Q193 106 191 99.50Q189 93 187 93Q184 93 178 103Q169 118 143 139L145 142M225 75Q225 2 226-15L211-22L211 1L126 1L126-18L111-24Q112-8 112 34.50Q112 77 111 94L126 85L209 85L218 95L234 81L225 75M126 79L126 7L161 7L161 79L126 79M175 79L175 7L211 7L211 79L175 79Z"  horiz-adv-x="256" vert-adv-y="256"  />'
let n:string =s.match(/glyph-name="(.*)"\s+unicode/)[1]
// console.log(n)
let path:string = s.match(/d="(.*)"\s+horiz/)[1]
// console.log(path)
let l:Array<Curve> =pathToCharaterWithCurve(path)
for(let i of l){
    console.log(i.toString())
}
