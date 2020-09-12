import { Coordinate } from './Coordinate'
import { Curve } from './Curve'

export class Point implements Coordinate {
  static equal(p1:Coordinate,p2: Coordinate): boolean {
    return p1.x == p2.x && p1.y == p2.y
  }

  x: number
  y: number
  relatedCurve: Curve[]=[]

  constructor(x: number, y: number) {
    this.x = x
    this.y = y
  }

  clone(): Point {
    return new Point(this.x, this.y)
  }

  offset(x: number, y: number): void {
    this.x = this.x + x
    this.y = this.y + y
  }

  toString(): string {
    return `(${this.x},${this.y})`
  }

  transformMatrix(
    a: number,
    b: number,
    c: number,
    d: number,
    e: number,
    f: number
  ): Point {
    let x: number = this.x * a + this.y * c + e
    let y: number = this.x * b + this.y * d + f
    return new Point(x, y)
  }
}