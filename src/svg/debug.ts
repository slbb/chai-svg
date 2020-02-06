// class
export class Point {
    x: number
    y: number
    constructor(x: number, y: number) {
        this.x = x
        this.y = y
    }
    offset(x: number, y: number) {
        this.x += x
        this.y += y
    }
    isSamePosition(p: Point): boolean {
        return this.x == p.x && this.y == p.y
    }
    toString(): string {
        return `(${this.x},${this.y})`
    }
    transformMatrix(a: number, b: number, c: number, d: number, e: number, f: number) {
        let x: number = this.x * a + this.y * c + e
        let y: number = this.x * b + this.y * d + f
        this.x = x
        this.y = y
    }
}

export abstract class Curve {
    id: number
    start: Point
    end: Point
    constructor(start: Point, end: Point) {
        this.id = 0
        this.start = start
        this.end = end
    }
    abstract getIntersectPoint(p: Point): Point[]
    abstract toString(): string
    abstract toPathString(): string
    abstract toPathStringLinked(lastEnd: Point): string
}

export class CurveL extends Curve {
    a: number
    b: number
    c: number
    constructor(start: Point, end: Point) {
        super(start, end)
        this.a = start.y - end.y
        this.b = end.x - start.x
        this.c = -this.a * start.x - this.b * start.y
    }
    toString() {
        return `L${this.start}${this.end}`
    }
    getIntersectPoint(p: Point): Point[] {
        if (Math.min(this.start.y, this.end.y) <= p.y && p.y <= Math.max(this.start.y, this.end.y)) {
            if (this.a * p.x + this.b * p.y + this.c == 0) {
                if (Math.min(this.start.x, this.end.x) <= p.x && p.x <= Math.max(this.start.x, this.end.x)) {
                    return [p]
                } else {
                    return []
                }
            } else {
                if (this.a == 0 && p.y == this.start.y) {
                    return []
                } else {
                    let x: number = (-this.c - this.b * p.y) / this.a
                    if (x >= p.x) {
                        return []
                    }
                    let y: number
                    if (this.b == 0) {
                        y = p.y
                    } else {
                        y = (this.c - this.a * p.x) / this.b
                    }
                    return [new Point(x, y)]
                }
            }
        } else {
            return []
        }
    }
    toPathString(): string {
        return `M${this.start.x} ${this.start.y}L${this.end.x} ${this.end.y}`
    }
    toPathStringLinked(lastEnd: Point): string {
        let s: string = `L${this.end.x} ${this.end.y}`
        if (lastEnd.isSamePosition(this.start)) {
            return s
        } else {
            return `M${this.start.x} ${this.start.y}${s}`
        }
    }
}
export class CurveQ extends Curve {
    //B(t)=(1-t)^2 start + 2t(1-t) control + t^2 end, t in [0,1]
    control: Point
    constructor(start: Point, end: Point, control: Point) {
        super(start, end)
        this.control = control
    }
    toString() {
        return `Q${this.start}${this.control}${this.end}`
    }
    getPointByT(t: number): Point {
        if (0 <= t && t <= 1) {
            let x: number = Math.pow((1 - t), 2) * this.start.x + 2 * t * (1 - t) * this.control.x + Math.pow(t, 2) * this.end.x
            let y: number = Math.pow((1 - t), 2) * this.start.y + 2 * t * (1 - t) * this.control.y + Math.pow(t, 2) * this.end.y
            return new Point(x, y)
        } else {
            throw "not valid t value";
        }
    }
    getIntersectPoint(p: Point): Point[] {
        /* 根据二次贝塞尔曲线公式，得到曲线上的点P(x,y)满足(t in [0,1]):
         * y=(start.y-2*control.y+end.y)*t^2 + 2*(control.y-start.y)*t + start.y
         *             ay                              by
         * x=(start.x-2*control.x+end.x)*t^2 + 2*(control.x-start.x)*t + start.x
         *             ax                              bx
         * mty:根据y的二次方程求得的极值y对应t值
         * mtx:根据x的二次方程求得的极值x对应t值
         * 求y=p.y时，t在[0,1]上有没有解。无解，则没有交点；有解则根据t求出x，x<=p.x时有交点，否则没有交点。
         */
        let ay: number = this.start.y - 2 * this.control.y + this.end.y
        let by: number = 2 * (this.control.y - this.start.y)
        let mty: number = -by / (2 * ay)
        function getIntersectPointMain(self: CurveQ): Point[] {
            let cy: number = self.start.y - p.y
            if (ay == 0) {
                //ay==0时，y的方程式是一次方程，用一次方程解法
                if (by == 0) {
                    //这种情况下，曲线是水平直线条，特殊处理
                    let ax: number = self.start.x - 2 * self.control.x + self.end.x
                    let bx: number = 2 * (self.control.x - self.start.x)
                    let mtx: number = -bx / (2 * ax)
                    if (0 <= mtx && mtx <= 1) {
                        let mx: number = ax * Math.pow(mtx, 2) + bx * mtx + self.start.x
                        if (Math.min(self.start.x, self.end.x, mx) <= p.x && p.x <= Math.max(self.start.x, self.end.x, mx)) {
                            return [p]
                        }
                        return []
                    } else {
                        if (Math.min(self.start.x, self.end.x) <= p.x && p.x <= Math.max(self.start.x, self.end.x)) {
                            return [p]
                        }
                        return []
                    }
                }
                let t: number = -cy / by
                if (0 <= t && t <= 1) {
                    let point: Point = self.getPointByT(t)
                    if (point.x <= p.x) {
                        return [point]
                    } else {
                        return []
                    }
                } else {
                    return []
                }
            } else {
                // ay!=0时，用二次方程解法
                let result: Point[] = []
                let delta: number = Math.pow(by, 2) - 4 * ay * cy
                if (delta >= 0) {
                    let t1: number = (-by + Math.sqrt(delta)) / (2 * ay)
                    if (0 <= t1 && t1 <= 1) {
                        let p1 = self.getPointByT(t1)
                        if (p1.x <= p.x) {
                            result.push(p1)
                        }
                    }
                    let t2: number = (-by - Math.sqrt(delta)) / (2 * ay)
                    if (0 <= t2 && t2 <= 1) {
                        let p2 = self.getPointByT(t2)
                        if (p2.x <= p.x) {
                            result.push(p2)
                        }
                    }
                }
                return result
            }
        }
        // 先判断p.y是不是在曲线范围内，如果不是就返回[]，是的话才用getIntersectPointMain找交点
        if (0 <= mty && mty <= 1) {
            let my: number = ay * Math.pow(mty, 2) + by * mty + this.start.y
            if (Math.min(this.start.y, this.end.y, my) <= p.y && p.y <= Math.max(this.start.y, this.end.y, my)) {
                return getIntersectPointMain(this)
            }
            return []
        } else {
            if (Math.min(this.start.y, this.end.y) <= p.y && p.y <= Math.max(this.start.y, this.end.y)) {
                return getIntersectPointMain(this)
            }
            return []
        }
    }
    getBiggestDistance(): number {
        //t=0.5时，曲线上点p到start和end成的直线距离最远
        if (this.start.x == this.end.x) {
            let x: number = this.start.x / 4 + this.control.x / 2 + this.end.x / 4
            return Math.abs(x - this.start.x)
        } else {
            let k: number = (this.start.y - this.end.y) / (this.start.x - this.end.x)
            let b: number = this.start.y - k * this.start.x
            return Math.abs(k * this.control.x - this.control.y + b) / 2 / Math.sqrt(Math.pow(k, 2) + 1)
        }
    }
    toPathString(): string {
        return `M${this.start.x} ${this.start.y}Q${this.control.x} ${this.control.y} ${this.end.x} ${this.end.y}`
    }
    toPathStringLinked(p: Point): string {
        let s: string = `Q${this.control.x} ${this.control.y} ${this.end.x} ${this.end.y}`
        if (p.isSamePosition(this.start)) {
            return s
        } else {
            return `M${this.start.x} ${this.start.y}${s}`
        }
    }
}

export class ClosedCurve {
    curves: Array<Curve>
    constructor(curves: Array<Curve>) {
        if (!curves[0].start.isSamePosition(curves[curves.length - 1].end)) {
            throw "curves are not closed"
        } else {
            this.curves = curves
        }
    }
    getPointList(): Array<Point> {
        let pl: Array<Point> = []
        for (let i in this.curves) {
            pl.push(this.curves[i].start)
        }
        return pl
    }
    isPointInside(p: Point): boolean {
        let count: number = 0
        for (let c of this.curves) {
            let points: Point[] = c.getIntersectPoint(p)
            if (points.some(point => point.isSamePosition(p))) {
                return true
            } else {
                points.forEach((value: Point, index: number, array: Point[]) => {
                    for (let i: number = 0; i < index; i++) {
                        if (array[i].isSamePosition(value)) {
                            return
                        }
                    }
                    count++
                })
            }
        }
        return count % 2 == 1
    }
    isClosedCurveInside(cc: ClosedCurve): boolean {
        for (let p of cc.getPointList()) {
            if (!(this.isPointInside(p))) {
                return false
            }
        }
        return true
    }
}
export class SeparatePart {
    outsideClosedCurve: ClosedCurve
    insideClosedCurves: Array<ClosedCurve> = []
    constructor(outsideClosedCurve: ClosedCurve) {
        this.outsideClosedCurve = outsideClosedCurve
    }
    hasInside(): boolean {
        return !(typeof (this.insideClosedCurves) == 'undefined' || this.insideClosedCurves.length == 0)
    }
    getCurveList(): Curve[] {
        let curveList: Curve[] = this.outsideClosedCurve.curves
        if (this.hasInside()) {
            for (let closedCurve of this.insideClosedCurves) {
                for (let curve of closedCurve.curves) {
                    curveList.push(curve)
                }
            }
        }
        return curveList
    }
}
// class end

// convert
export function pathToCurveList(path: string): Array<Curve> {
    function paramsStrToParamsList(paramsStr: string): Array<number> {
        let paramsList: Array<number> = []
        for (let i of paramsStr.trim().split(/[,\s]+|(?<=\d)(?=-)/)) {
            paramsList.push(Number(i))
        }
        return paramsList
    }
    let headPoint: Point | null = null
    let nowPoint: Point = new Point(0, 0)
    let curveList: Array<Curve> = []
    let first = path.trim().split(/(?<=\d)\s*(?=[A-Za-z])/)
    for (let i of first) {
        let paramsList: number[] = []
        let split: string[] = i.split(/(?<=[A-Za-z])/)
        let typeName: string = split[0]
        let paramsStr: string = split[1]
        if (paramsStr) {
            paramsList = paramsStrToParamsList(paramsStr)
        }
        let end: Point
        switch (typeName.toLowerCase()) {
            case 'm':
                end = new Point(paramsList[0], paramsList[1])
                if (typeName == 'm') {
                    end.offset(nowPoint.x, nowPoint.y)
                }
                headPoint = end
                nowPoint = end
                break;
            case 'l':
                end = new Point(paramsList[0], paramsList[1])
                if (typeName == 'l') {
                    end.offset(nowPoint.x, nowPoint.y)
                }
                if (headPoint != null && end.isSamePosition(headPoint)) {
                    end = headPoint
                    headPoint = null
                }
                curveList.push(new CurveL(nowPoint, end))
                nowPoint = end
                break
            case 'h':
                end = new Point(paramsList[0], paramsList[1])
                if (typeName == 'h') {
                    end.offset(nowPoint.x, 0)
                }
                if (headPoint != null && end.isSamePosition(headPoint)) {
                    end = headPoint
                    headPoint = null
                }
                curveList.push(new CurveL(nowPoint, end))
                nowPoint = end
                break
            case 'v':
                end = new Point(nowPoint.x, paramsList[0])
                if (typeName == 'v') {
                    end.offset(0, nowPoint.y)
                }
                if (headPoint != null && end.isSamePosition(headPoint)) {
                    end = headPoint
                    headPoint = null
                }
                curveList.push(new CurveL(nowPoint, end))
                nowPoint = end
                break
            case 'q':
                end = new Point(paramsList[2], paramsList[3])
                let control: Point = new Point(paramsList[0], paramsList[1])
                if (typeName == 'q') {
                    end.offset(nowPoint.x, nowPoint.y)
                    control.offset(nowPoint.x, nowPoint.y)
                }
                if (headPoint != null && end.isSamePosition(headPoint)) {
                    end = headPoint
                    headPoint = null
                }
                curveList.push(new CurveQ(nowPoint, end, control))
                nowPoint = end
                break
            case 't':
                break
            case 'c':
                break
            case 's':
                break
            case 'a':
                break
            case 'z':
                if (headPoint != null) {
                    if (!headPoint.isSamePosition(nowPoint)) {
                        curveList.push(new CurveL(nowPoint, headPoint))
                    }
                    nowPoint = headPoint
                }
                break
            default:
                throw "not supported svg command found"
        }
    }
    return curveList
}

export function curveListToPath(curveList: Array<Curve>): string {
    let path: string = ''
    let lastEnd: Point = new Point(0, 0)
    for (let curve of curveList) {
        path += curve.toPathStringLinked(lastEnd)
        lastEnd = curve.end
    }
    path = path.replace(/ -/g, '-')
    path += 'Z'
    return path
}
// convert end
// handle
export function findClosedCurves(curves: Array<Curve>): Array<ClosedCurve> {
    let headPoint: Point | null = null
    let characterWithClosedCurve: Array<ClosedCurve> = []
    let closedCurveList: Array<Curve> = []
    for (let c of curves) {
        if (headPoint == null) {
            headPoint = c.start
            closedCurveList.push(c)
            continue
        }
        if (!c.end.isSamePosition(headPoint)) {
            closedCurveList.push(c)
        } else {
            closedCurveList.push(c)
            characterWithClosedCurve.push(new ClosedCurve(closedCurveList))
            closedCurveList = []
            headPoint = null
        }
    }
    return characterWithClosedCurve
}
export function generateCharacterSeparatePart(characterWithClosedCurve: Array<ClosedCurve>): Array<SeparatePart> {
    let l: number = characterWithClosedCurve.length
    let fatherMarkList: Array<number | undefined> = new Array(l)
    fatherMarkList.fill(undefined)
    function findFather(i: number, j: number) {
        if (characterWithClosedCurve[j].isClosedCurveInside(characterWithClosedCurve[i])) {
            let mark: number | undefined = fatherMarkList[i]
            if (typeof mark == 'undefined') {
                fatherMarkList[i] = j
            } else if (typeof mark == 'number') {
                let iFather: ClosedCurve = characterWithClosedCurve[mark]
                if (!characterWithClosedCurve[j].isClosedCurveInside(iFather)) {
                    fatherMarkList[i] = j
                }
            }
        }
    }
    for (let i = 0; i < l; i++) {
        for (let j = i + 1; j < l; j++) {
            findFather(i, j)
            findFather(j, i)
        }
    }
    let generationList: number[] = fatherMarkList.map(
        (value: number | undefined, _index: number | undefined, array: Array<number | undefined>): number => {
            let generation: number = 1
            function getGeneration(v: number | undefined) {
                if (typeof v == 'undefined') {
                    return
                } else {
                    generation += 1
                    getGeneration(array[v])
                }
            }
            getGeneration(value)
            return generation % 2 == 1 ? 0 : 1
        }
    )
    let characterWithSeparateParts: Array<SeparatePart> = []
    for (let i in fatherMarkList) {
        if (!generationList[i]) {
            let part: SeparatePart = new SeparatePart(characterWithClosedCurve[i]);
            for (let j in fatherMarkList) {
                if (fatherMarkList[j] == Number(i)) {
                    part.insideClosedCurves.push(characterWithClosedCurve[j])
                }
            }

            characterWithSeparateParts.push(part)
        }
    }
    return characterWithSeparateParts
}
export function displayCharacterWithSeparateParts(c: SeparatePart[]): string[] {
    let paths: string[] = []
    for (let sp of c) {
        paths.push(curveListToPath(sp.getCurveList()))
    }
    return paths
}
export function displayEachCurveOfSeparateParts(c: SeparatePart[]): Array<string[]> {
    let spPaths: Array<string[]> = []
    for (let sp of c) {
        let paths: string[] = []
        for (let curve of sp.getCurveList()) {
            paths.push(curve.toPathString())
        }
        spPaths.push(paths)
    }
    return spPaths
}
export function findHV(s: SeparatePart): void {
    for (let c of s.getCurveList()) {
        if (c instanceof CurveL) {
            if (c.b == 0) {
                c.id = 1
            } else {
                let k_abs: number = Math.abs(c.a / c.b)
                if (k_abs > 40) {
                    c.id = 1
                } else if (k_abs < 0.025) {
                    c.id = 2
                }
            }
        } else if (c instanceof CurveQ) {
            let b: number = c.start.x - c.end.x
            if (b == 0 && c.getBiggestDistance() < 5) {
                c.id = 1
            } else {
                let k_abs = Math.abs((c.start.y - c.end.y) / b)
                if (k_abs > 20 && c.getBiggestDistance() < 7) {
                    c.id = 1
                } else if (k_abs < 0.2 && c.getBiggestDistance() < 7) {
                    c.id = 2
                }
            }
        }
    }
}

export function findLine(s: SeparatePart): void {
    let curveList = s.getCurveList()
    let unhandledMarkList: boolean[] = new Array(curveList.length)
    unhandledMarkList.fill(true)
    for (let index in curveList) {
        if (unhandledMarkList[index]) {
            // heng

        }
    }
}
// handle end
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
testSeparatePart()
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