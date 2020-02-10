import { generateCharacterSeparatePart, findClosedCurves, displayCharacterWithSeparateParts } from "./handle"
import { pathToCurveList } from './convert'
import { Point, CurveQ, ClosedCurve, CurveL } from './class'

// test
function testSeparatePart() {
    const s: string = '<glyph glyph-name="uni4E34" unicode="&#x4E34;" d="M39 55Q39 42 40 24L24 17Q25 46 25 100.50Q25 155 24 174L47 164L39 157L39 55M67-26Q68-1 68 16L68 179Q68 193 67 209L92 198L82 191L82 16Q82-2 83-18L67-26M153 190Q143 170 137 159L204 159L217 172L236 153L135 153Q114 115 92 97L89 99Q124 144 140 209L163 195L153 190M145 142Q170 132 181.50 125Q193 118 193 109Q193 106 191 99.50Q189 93 187 93Q184 93 178 103Q169 118 143 139L145 142M225 75Q225 2 226-15L211-22L211 1L126 1L126-18L111-24Q112-8 112 34.50Q112 77 111 94L126 85L209 85L218 95L234 81L225 75M126 79L126 7L161 7L161 79L126 79M175 79L175 7L211 7L211 79L175 79Z"  horiz-adv-x="256" vert-adv-y="256"  />'
    // let nameMatch = s.match(/glyph-name="(.*)"\s+unicode/)
    // let n: string = nameMatch != null ? nameMatch[1] : ''
    // console.log(n)
    let pathMatch = s.match(/d="(.*)"\s+horiz/)
    let path: string = pathMatch != null ? pathMatch[1] : ''
    // console.log(path)
    // let l: Array<Curve> = pathToCurveList(path)
    let sp = generateCharacterSeparatePart(findClosedCurves(pathToCurveList(path)))
    let paths: string[] = displayCharacterWithSeparateParts(sp)
    console.log(paths);
}
function testOneSep() {
    const path = "M39 55Q39 42 40 24L24 17Q25 46 25 100.50Q25 155 24 174L47 164L39 157L39 55M67-26Q68-1 68 16L68 179Q68 193 67 209L92 198L82 191L82 16Q82-2 83-18L67-26M153 190Q143 170 137 159L204 159L217 172L236 153L135 153Q114 115 92 97L89 99Q124 144 140 209L163 195L153 190M145 142Q170 132 181.50 125Q193 118 193 109Q193 106 191 99.50Q189 93 187 93Q184 93 178 103Q169 118 143 139L145 142M225 75Q225 2 226-15L211-22L211 1L126 1L126-18L111-24Q112-8 112 34.50Q112 77 111 94L126 85L209 85L218 95L234 81L225 75M126 79L126 7L161 7L161 79L126 79M175 79L175 7L211 7L211 79L175 79Z"
    let ccl = findClosedCurves(pathToCurveList(path))
    let ccc5 = ccl[5]
    let ccc6 = ccl[6]
    // console.log(ccc5.getPointList());
    // console.log(ccc6.getPointList());
    let point = ccc6.getPointList()[3]
    console.log(point);
    // let curve = ccc5.curves[3]
    // console.log(curve);
    // console.log(curve.getIntersectPoint(point));

    console.log(ccc5.isPointInside(point));

    // console.log(cc4.isClosedCurveInside(cc5));
}
// testOneSep()
function testPointInsideClosedCurve() {
    let p1 = new Point(1, 1)
    let p2 = new Point(0, 2)
    let p3 = new Point(1, 3)
    let p4 = new Point(2, 4)
    let p5 = new Point(3, 3)
    let p6 = new Point(4, 2)
    let p7 = new Point(3, 1)
    let p8 = new Point(2, 0)
    let q1 = new CurveQ(p1, p3, p2)
    let q2 = new CurveQ(p3, p5, p4)
    let q3 = new CurveQ(p5, p7, p6)
    let q4 = new CurveQ(p7, p1, p8)
    let cct = new ClosedCurve([q1, q2, q3, q4])
    let tp = new Point(2, 1.5)
    console.log(q1.getIntersectPoint(tp));
    console.log(q2.getIntersectPoint(tp));
    console.log(q3.getIntersectPoint(tp));
    console.log(q4.getIntersectPoint(tp));

    console.log(cct.isPointInside(tp));
}
function testClosedCurveInsideAnother() {
    let p1 = new Point(1, 1)
    let p2 = new Point(0, 2)
    let p3 = new Point(1, 3)
    let p4 = new Point(2, 4)
    let p5 = new Point(3, 3)
    let p6 = new Point(4, 2)
    let p7 = new Point(3, 1)
    let p8 = new Point(2, 0)
    let q1 = new CurveQ(p1, p3, p2)
    let q2 = new CurveQ(p3, p5, p4)
    let q3 = new CurveQ(p5, p7, p6)
    let q4 = new CurveQ(p7, p1, p8)
    let cct = new ClosedCurve([q1, q2, q3, q4])
    let ap1 = new Point(1.5, 1.5)
    let ap2 = new Point(1.5, 2.5)
    let ap3 = new Point(2.5, 2.5)
    let ap4 = new Point(2.5, 1.5)
    let l1 = new CurveL(ap1, ap2)
    let l2 = new CurveL(ap2, ap3)
    let l3 = new CurveL(ap3, ap4)
    let l4 = new CurveL(ap4, ap1)
    let cct2 = new ClosedCurve([l1, l2, l3, l4])
    console.log(cct.isClosedCurveInside(cct2));
}