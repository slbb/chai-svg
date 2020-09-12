import { Point } from './Point';
import { CurveL } from './CurveL';

export class Link extends CurveL{
  constructor(start: Point, end: Point) {
    super(start, end)
  }
}
