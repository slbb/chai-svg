class Point {
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
    toString() {
        return `(${this.x},${this.y})`
    }
}

abstract class Curve {
    start: Point
    end: Point
    constructor(start: Point, end: Point) {
        this.start = start
        this.end = end
    }
    abstract isIntersect(p: Point): boolean
}

class CurveL extends Curve {
    a: number
    b: number
    c: number
    constructor(start: Point, end: Point) {
        super(start, end)
        this.a = start.x - end.x
        this.b = start.y - end.y
        this.c = -this.a * start.x - this.b * start.y
    }
    isIntersect(p: Point): boolean {
        if (this.a == 0) {
            return p.y == this.start.y
        } else {
            if (Math.min(this.start.y, this.end.y) <= p.y && p.y <= Math.max(this.start.y, this.end.y)) {
                let x: number = (-this.c - this.b * p.y) / this.a
                return x <= p.x
            } else {
                return false
            }
        }
    }
}