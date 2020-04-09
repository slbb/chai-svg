/**
 * 返回参数角的180度转角
 * @param angle 参数角
 */
function turn180(angle: number): number {
    return angle > 0 ? angle - 180 : angle + 180
}
/**
 * 返回从角a转动到角b的度数，逆时针为正，顺时针为负
 * @param a 角a
 * @param b 角b
 */
function calcTurnAngle(a: number, b: number): number {
    return Math.abs(b - a) > 180 ? turn180(b) - turn180(a) : b - a
}
/**
 * 返回 [端点的切线朝外角度 , 以端点为头时Curve/Line的转角 ]
 * @param head Curve/Line的端点，头或尾
 * @param curveOrLine Curve/Line本身
 */
function getAnglesByHead(head: { x: number, y: number }, curveOrLine: Curve|Line): number[] {
    if (curveOrLine.getStart().isSamePosition(head)) {
        return [curveOrLine.getStartDirection(), curveOrLine.getTurnAngle()]
    } else if (curveOrLine.getEnd().isSamePosition(head)) {
        return [curveOrLine.getEndDirection(), -curveOrLine.getTurnAngle()]
    } else {
        throw 'the parameter point given is not the head point of this curve/line'
    }
}

class T {
    x: number
    y: number
    static parsePoint(hashcode: string): { x: number, y: number } {
        let [a, b] = hashcode.split(/,/)
        return { x: Number(a), y: Number(b) }
    }
    constructor(x: number, y: number) {
        this.x = x
        this.y = y
    }
    clone(): T {
        return new T(this.x, this.y)
    }
    offset(x: number, y: number): T {
        this.x = this.x + x
        this.y = this.y + y
        return this
    }
    isSamePosition(p: { x: number, y: number }): boolean {
        return this.x == p.x && this.y == p.y
    }
    hashcode(): string {
        return `${this.x},${this.y}`
    }
    toString(): string {
        return `(${this.x},${this.y})`
    }
    transformMatrix(a: number, b: number, c: number, d: number, e: number, f: number): T {
        let x: number = this.x * a + this.y * c + e
        let y: number = this.x * b + this.y * d + f
        return new T(x, y)
    }
}

abstract class Curve {
    start: T
    end: T
    constructor(start: T, end: T) {
        this.start = start
        this.end = end
    }
    getStart():T{
        return this.start
    }
    getEnd():T{
        return this.end
    }
    abstract getIntersectPoint(p: T): T[]
    abstract getStartDirection(): number
    abstract getEndDirection(): number
    getTurnAngle(): number {
        return calcTurnAngle(turn180(this.getStartDirection()), this.getEndDirection())
    }
    abstract reverse(): Curve
    abstract toString(): string
    abstract toPathString(): string
    abstract toPathStringLinked(lastEnd: T): string
}

class CurveL extends Curve {
    constructor(start: T, end: T) {
        super(start, end)
    }
    toString() {
        return `L${this.start}${this.end}`
    }
    getABC(): number[] {
        let a: number = this.start.y - this.end.y
        let b: number = this.end.x - this.start.x
        let c: number = -a * this.start.x - b * this.start.y
        return [a, b, c]
    }
    getIntersectPoint(p: T): T[] {
        let [a, b, c]: number[] = this.getABC()
        if (Math.min(this.start.y, this.end.y) <= p.y && p.y <= Math.max(this.start.y, this.end.y)) {
            if (a * p.x + b * p.y + c == 0) {
                if (Math.min(this.start.x, this.end.x) <= p.x && p.x <= Math.max(this.start.x, this.end.x)) {
                    return [p]
                } else {
                    return []
                }
            } else {
                if (a == 0 && p.y == this.start.y) {
                    return []
                } else {
                    let x: number = (-c - b * p.y) / a
                    if (x >= p.x) {
                        return []
                    }
                    let y: number
                    if (b == 0) {
                        y = p.y
                    } else {
                        y = (c - a * p.x) / b
                    }
                    return [new T(x, y)]
                }
            }
        } else {
            return []
        }
    }
    getStartDirection(): number {
        return Math.atan2(this.start.y - this.end.y, this.start.x - this.end.x) / Math.PI * 180
    }
    getEndDirection(): number {
        return Math.atan2(this.end.y - this.start.y, this.end.x - this.start.x) / Math.PI * 180
    }
    reverse(): CurveL {
        [this.start, this.end] = [this.end, this.start]
        return this
    }
    toPathString(): string {
        return `M${this.start.x} ${this.start.y}L${this.end.x} ${this.end.y}`
    }
    toPathStringLinked(lastEnd: T): string {
        let s: string = `L${this.end.x} ${this.end.y}`
        if (lastEnd.isSamePosition(this.start)) {
            return s
        } else {
            return `M${this.start.x} ${this.start.y}${s}`
        }
    }
}
class CurveQ extends Curve {
    //B(t)=(1-t)^2 start + 2t(1-t) control + t^2 end, t in [0,1]
    control: T
    constructor(start: T, end: T, control: T) {
        super(start, end)
        this.control = control
    }
    toString() {
        return `Q${this.start}${this.control}${this.end}`
    }
    getPointByT(t: number): T {
        if (0 <= t && t <= 1) {
            let x: number = Math.pow((1 - t), 2) * this.start.x + 2 * t * (1 - t) * this.control.x + Math.pow(t, 2) * this.end.x
            let y: number = Math.pow((1 - t), 2) * this.start.y + 2 * t * (1 - t) * this.control.y + Math.pow(t, 2) * this.end.y
            return new T(x, y)
        } else {
            throw "not valid t value";
        }
    }
    getIntersectPoint(p: T): T[] {
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
        function getIntersectPointMain(self: CurveQ): T[] {
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
                    let point: T = self.getPointByT(t)
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
                let result: T[] = []
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
    getLength(t: number = 1): number {
        if (t < 0 || t > 1) {
            throw 'not valid t value'
        }
        let ax: number = this.start.x - 2 * this.control.x + this.end.x
        let bx: number = 2 * (this.control.x - this.start.x)
        let ay: number = this.start.y - 2 * this.control.y + this.end.y
        let by: number = 2 * (this.control.y - this.start.y)
        let a: number = 4 * (ax * ax + ay * ay)
        let b: number = 4 * (ax * bx + ay * by)
        let c: number = bx * bx + by * by
        //别人文章中的公式 注：直线也是一种特殊的贝塞尔曲线，此公式不适用于直线，不然会计算出NaN
        return (2 * Math.sqrt(a) * (2 * a * t * Math.sqrt(a * t * t + b * t + c) + b * (Math.sqrt(a * t * t + b * t + c) - Math.sqrt(c))) + (b * b - 4 * a * c) * (Math.log(b + 2 * Math.sqrt(a * c)) - Math.log(b + 2 * a * t + 2 * Math.sqrt(a) * Math.sqrt(a * t * t + b * t + c)))) / (8 * Math.pow(a, 3 / 2))
    }
    reverse(): CurveQ {
        [this.start, this.end] = [this.end, this.start]
        return this
    }
    getStartDirection(): number {
        return Math.atan2(this.start.y - this.control.y, this.start.x - this.control.x) / Math.PI * 180
    }
    getEndDirection(): number {
        return Math.atan2(this.end.y - this.control.y, this.end.x - this.control.x) / Math.PI * 180
    }
    toPathString(): string {
        return `M${this.start.x} ${this.start.y}Q${this.control.x} ${this.control.y} ${this.end.x} ${this.end.y}`
    }
    toPathStringLinked(p: T): string {
        let s: string = `Q${this.control.x} ${this.control.y} ${this.end.x} ${this.end.y}`
        if (p.isSamePosition(this.start)) {
            return s
        } else {
            return `M${this.start.x} ${this.start.y}${s}`
        }
    }
}

class ClosedCurve {
    curves: Array<Curve>
    constructor(curves: Array<Curve>) {
        if (!curves[0].start.isSamePosition(curves[curves.length - 1].end)) {
            throw "curves are not closed"
        } else {
            this.curves = curves
        }
    }
    getPointList(): Array<T> {
        let points: Set<T> = new Set()
        for (let c of this.curves) {
            points.add(c.start)
            points.add(c.end)
        }
        return Array.from(points)
    }
    isPointInside(p: T): boolean {
        let count: number = 0
        for (let c of this.curves) {
            let points: T[] = c.getIntersectPoint(p)
            if (points.some(point => point.isSamePosition(p))) {
                return true
            } else {
                points.forEach((value: T, index: number, array: T[]) => {
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
    toPathString(): string {
        let path: string = ''
        let lastEnd: T = new T(0, 0)
        for (let curve of this.curves) {
            path += curve.toPathStringLinked(lastEnd)
            lastEnd = curve.end
        }
        path = path.replace(/ -/g, '-')
        path += 'Z'
        return path
    }
}
class SeparatePart {
    outsideClosedCurve: ClosedCurve
    insideClosedCurves: Array<ClosedCurve> = []
    constructor(outsideClosedCurve: ClosedCurve) {
        this.outsideClosedCurve = outsideClosedCurve
    }
    hasInside(): boolean {
        return this.insideClosedCurves.length > 0
    }
    getClosedCurves(): ClosedCurve[] {
        return this.insideClosedCurves.concat(this.outsideClosedCurve)
    }
    getCurveList(): Curve[] {
        let curveList: Curve[] = this.outsideClosedCurve.curves
        for (let closedCurve of this.insideClosedCurves) {
            curveList = curveList.concat(closedCurve.curves)
        }
        return curveList
    }
    toPathString(): string {
        let path: string = ''
        path += this.outsideClosedCurve.toPathString()
        if (this.hasInside()) {
            for (let cc of this.insideClosedCurves) {
                path += cc.toPathString()
            }
        }
        return path
    }
}
class Line {
    curves: Curve[]
    constructor(curve: Curve) {
        this.curves = new Array()
        this.curves.push(curve)
    }
    getStart():T{
        return this.getStartCurve().start
    }
    getEnd():T{
        return this.getEndCurve().end
    }
    addCurveToEnd(curve: Curve): void {
        this.curves.push(curve)
    }
    addCurveToStart(curve: Curve): void {
        let tmp: Curve[] = []
        tmp.push(curve)
        this.curves = tmp.concat(this.curves)
    }
    getEndCurve(): Curve {
        return this.curves[this.curves.length - 1]
    }
    getStartCurve(): Curve {
        return this.curves[0]
    }
    getStartDirection():number{
        return this.getStartCurve().getStartDirection()
    }
    getEndDirection():number{
        return this.getEndCurve().getEndDirection()
    }
    getTurnAngle(): number {
        return calcTurnAngle(turn180(this.getStartCurve().getStartDirection()), this.getEndCurve().getEndDirection())
    }
    toPathString(): string {
        let path: string = ''
        let lastEnd: T = new T(0, 0)
        for (let c of this.curves) {
            path += c.toPathStringLinked(lastEnd)
            lastEnd = c.end
        }
        return path
    }
}
function pathToCurveList(path: string): Array<Curve> {
    let lastPoint: T = new T(0, 0)
    let curves: Array<Curve> = []
    let operatorStrs = path.trim().split(/(?<=\d|[Zz])\s*(?=[A-Za-z])/)
    for (let operatorStr of operatorStrs) {
        let params: number[] = []
        let [typeName, paramsStr] = operatorStr.split(/(?<=[A-Za-z])/)
        if (paramsStr) {
            params = paramsStr.trim().split(/[,\s]+|(?<=\d)(?=-)/).map((value) => Number(value))
        }
        if (typeName.toUpperCase() == 'M') {
            [lastPoint.x, lastPoint.y] = params
            if (typeName == 'm') {
                lastPoint.offset(params[0], params[1])
            }
        } else if (typeName.toUpperCase() == 'L') {
            let end = new T(params[0], params[1])
            if (typeName == 'l') {
                end.offset(lastPoint.x, lastPoint.y)
            }
            curves.push(new CurveL(lastPoint.clone(), end));
            [lastPoint.x, lastPoint.y] = [end.x, end.y]
        } else if(typeName.toUpperCase()== 'Q') {
            let [control,end]=[new T(params[0],params[1]),new T(params[2],params[3])]
            if (typeName == 'q') {
                control.offset(lastPoint.x,lastPoint.y)
                end.offset(lastPoint.x,lastPoint.y)
            }
            curves.push(new CurveQ(lastPoint.clone(),end,control));
            [lastPoint.x, lastPoint.y] = [end.x, end.y]
        }
        //H V T S C A Z暂时用不上，省略了
    }
    return curves
}

function useDupPoint(curves:Curve[]):void {
    let points:T[]=[]
    function search(point:T):T|undefined{
        for(let p of points){
            if(p.isSamePosition(point)){
                return p
            }
        }
        points.push(point)
        return undefined
    }
    for(let c of curves){
        let found=search(c.start)
        if(found){
            c.start=found
        }
        found=search(c.end)
        if(found){
            c.end=found
        }
    }
}function findClosedCurves(curves: Array<Curve>): Array<ClosedCurve> {
    let headPoint: T | null = null
    let result: Array<ClosedCurve> = []
    let closedCurve: Array<Curve> = []
    for (let c of curves) {
        if (headPoint == null) {
            headPoint = c.start
            closedCurve.push(c)
            continue
        }
        if (!c.end.isSamePosition(headPoint)) {
            closedCurve.push(c)
        } else {
            closedCurve.push(c)
            result.push(new ClosedCurve(closedCurve))
            closedCurve = []
            headPoint = null
        }
    }
    return result
}
function generateSeparatePart(closedCurves: Array<ClosedCurve>): Array<SeparatePart> {
    let l: number = closedCurves.length
    let fatherMarkList: Array<number | undefined> = new Array(l)
    fatherMarkList.fill(undefined)
    function findFather(i: number, j: number) {
        if (closedCurves[j].isClosedCurveInside(closedCurves[i])) {
            let mark: number | undefined = fatherMarkList[i]
            if (typeof mark == 'undefined') {
                fatherMarkList[i] = j
            } else if (typeof mark == 'number') {
                let iFather: ClosedCurve = closedCurves[mark]
                if (!closedCurves[j].isClosedCurveInside(iFather)) {
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
    let result: Array<SeparatePart> = []
    for (let i in fatherMarkList) {
        if (!generationList[i]) {
            let part: SeparatePart = new SeparatePart(closedCurves[i]);
            for (let j in fatherMarkList) {
                if (fatherMarkList[j] == Number(i)) {
                    part.insideClosedCurves.push(closedCurves[j])
                }
            }

            result.push(part)
        }
    }
    return result
}
function findLines(curves: Curve[]): Line[] {
    let result: Line[] = []
    const point_curveMap = new Map<string, Curve[]>()
    function initMap(p: T, c: Curve): void {
        if (point_curveMap.has(p.hashcode())) {
            point_curveMap.get(p.hashcode())?.push(c)
        } else {
            point_curveMap.set(p.hashcode(), [c])
        }
    }
    for (let c of curves) {
        initMap(c.start, c)
        initMap(c.end, c)
    }
    let unhandledMarks: boolean[] = new Array(curves.length)
    unhandledMarks.fill(true)
    function calcDistance(p1: { x: number, y: number }, p2: { x: number, y: number }): number {
        return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2))
    }
    for (let i = 0; i < curves.length; i++) {
        if (unhandledMarks[i]) {
            let line: Line = new Line(curves[i])
            result.push(line)
            unhandledMarks[i] = false
            let range = 20
            //head
            function search(backward: boolean): void {
                let lHead = backward ? line.getStart() : line.getEnd()
                //遍历map的key（点坐标）
                for (let cHead_hc of point_curveMap.keys()) {
                    let cHead = T.parsePoint(cHead_hc)
                    //找到符合range的坐标，取出map的value（curves），进行下一步
                    if (cHead.x < lHead.x + range && cHead.x > lHead.x - range && cHead.y < lHead.y + range && cHead.y > lHead.y - range) {
                        let validCurve: { curve: Curve, min_turn: number } | null = null
                        let cHead_curves = point_curveMap.get(cHead_hc)
                        if (cHead_curves) {
                            //遍历取出的curves，计算角度数据是否符合条件
                            for (let c of cHead_curves) {
                                if (unhandledMarks[curves.indexOf(c)]) {
                                    //line端点切线角度，line自身的总转角
                                    let [lHead_D, l_turn] = getAnglesByHead(lHead, line)
                                    //curve端点切线角度，curve自身的总转角
                                    let [cHead_D, c_turn] = getAnglesByHead(cHead, c)
                                    //从 line端点切线角度 转向 curve端点切线角度，求出转角
                                    let lHead_cHead_turn: number = calcTurnAngle(lHead_D, cHead_D)
                                    //首先排除line和curve总转角之和太大的，以及端点处切线角度差距太大的
                                    if (l_turn + c_turn < 90 && lHead_cHead_turn > 20) {
                                        //line端点和curve端点的距离
                                        let lHead_cHead_distance: number = calcDistance(cHead, lHead)
                                        //line和curve端点连线的成角
                                        let lcHead_angle: number = Math.atan2(cHead.y - lHead.y, cHead.x - lHead.x) / Math.PI * 180
                                        //line和端点连线的成角之间的转角
                                        let lHead_lcHead_turn: number = calcTurnAngle(lHead_D, lcHead_angle)
                                        let isValidFlag: boolean = lHead_cHead_distance == 0 || (lHead_cHead_turn * lHead_lcHead_turn >= 0 && Math.abs(lHead_lcHead_turn) <= Math.abs(lHead_cHead_turn))
                                        if (isValidFlag) {
                                            if (validCurve) {
                                                validCurve = validCurve.min_turn > lHead_cHead_turn ? { curve: c, min_turn: lHead_cHead_turn } : validCurve
                                            } else {
                                                validCurve = { curve: c, min_turn: lHead_cHead_turn }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        if (validCurve) {
                            if (backward) {
                                if (validCurve.curve.start.isSamePosition(cHead)) {
                                    line.addCurveToStart(validCurve.curve.reverse())
                                } else if (validCurve.curve.end.isSamePosition(cHead)) {
                                    line.addCurveToStart(validCurve.curve)
                                } else {
                                    throw 'bug occurs in search()'
                                }
                            } else {
                                if (validCurve.curve.start.isSamePosition(cHead)) {
                                    line.addCurveToEnd(validCurve.curve)
                                } else if (validCurve.curve.end.isSamePosition(cHead)) {
                                    line.addCurveToEnd(validCurve.curve.reverse())
                                } else {
                                    throw 'bug occurs in search()'
                                }
                            }
                            unhandledMarks[curves.indexOf(validCurve.curve)] = false
                            //找到的话就递归查找，直到找不到为止
                            search(backward)
                            return
                        }
                    }
                }
                return
            }
            search(true)
            search(false)
        }
    }
    return result
}