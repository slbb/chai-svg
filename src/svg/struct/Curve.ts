import { Coordinate } from './Coordinate';
import { Point } from './Point'
import { calcAngleTurn, turn180 } from '../utils/utils';

export abstract class Curve{
  start: Point
  end: Point

  constructor(start: Point, end: Point) {
    this.start = start
    this.end = end
  }

  getTurnAngle(): number {
    return calcAngleTurn(turn180(this.startDirection), this.endDirection)
  }
  getPoints(): Point[]{
    return [this.start,this.end]
  }

  abstract get startDirection(): number
  abstract get endDirection(): number
  // abstract isOn(p: Coordinate): boolean
  abstract reverse(): Curve
  abstract toString(): string
  abstract toPathString(): string
  abstract toPathStringLinked(lastEnd: Point): string
}
