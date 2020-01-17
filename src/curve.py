from typing import *
import abc
Num = TypeVar('Num', int, float)

class Point:
    def __init__(self, x: Num, y: Num) -> None:
        self.x = x
        self.y = y

    def offset(self, x: Num, y: Num) -> None:
        self.x = self.x+x
        self.y = self.y+y

    def __str__(self):
        return '({0},{1})'.format(self.x, self.y)

    def isSamePosition(self, p: Point) -> bool:
        return self.x == p.x and self.y == p.y


class Curve(object):
    def __init__(self, start: Point, end: Point) -> None:
        self.start = start
        self.end = end

    @abc.abstractmethod
    def isIntersect(self, p: Point) -> bool:
        """
        用途：
            用于判断点是否在闭合曲线组内（点在闭合曲线边缘上也算作在内）。
            要对闭合曲线组中每一条曲线运行此方法，返回True为奇数次则点在闭合曲线组内。
        方法描述：
            给定一个待判断点p，作射线y=p.y(x<p.x)。
            判断该射线是否与Curve相交
        """
        pass


class CurveL(Curve):
    def __init__(self, start: Point, end: Point):
        super().__init__(start, end)
        self.a = start.x-end.x
        self.b = start.y-end.y
        self.c = -self.a*start.x-self.b*start.y

    def __str__(self):
        return 'L{0}{1}'.format(self.start.__str__(), self.end.__str__())

    def isIntersect(self, p: Point) -> bool:
        if self.a == 0:
            if p.y == self.start.y:
                return True
            else:
                return False
        else:
            if self.start.y <= p.y <= self.end.y or self.end.y <= p.y <= self.end.y:
                x = (-self.c-self.b*p.y)/self.a
                return x <= p.x
            else:
                return False


class CurveQ(Curve):
    """B(t)=(1-t)^2 start + 2t(1-t) control + t^2 end, t in [0,1]"""

    def __init__(self, start: Point, end: Point, control: Point):
        super().__init__(start, end)
        self.control = control

    def __str__(self):
        return 'Q{0}{1}{2}'.format(self.start.__str__(), self.end.__str__(), self.control.__str__())

    def isIntersect(self, p: Point) -> bool:
        """
        根据二次贝塞尔曲线公式，得到曲线上的点P(x,y)满足(t in [0,1]):
        y=(start.y-2*control.y+end.y)*t^2 + 2*(control.y-start.y)*t + start.y
        x=(start.x-2*control.x+end.x)*t^2 + 2*(control.x-start.x)*t + start.x
        求y=p.y时，t在[0,1]上有没有解。无解，则False；有解则根据t求出x，x<p.x True，否则False。
        """
        a = self.start.y-2*self.control.y+self.end.y
        b = 2*(self.control.y-self.start.y)
        c = self.start.y-p.y
        delta = b ^ 2-4*a*c
        if delta >= 0:
            t1 = (-b+delta**0.5)/(2*a)
            if 0 <= t1 <= 1:
                x1 = (self.start.x-2*self.control.x+self.end.x)*t1 ^ 2 + \
                    2*(self.control.x-self.start.x)*t + self.start.x
                if x1 <= p.x:
                    return True
            t2 = (-b-delta**0.5)/(2*a)
            if 0 <= t2 <= 1:
                x2 = (self.start.x-2*self.control.x+self.end.x)*t2 ^ 2 + \
                    2*(self.control.x-self.start.x)*t + self.start.x
                if x2 <= p.x:
                    return True
            return False
        else:
            return False

class ClosedCurve(object):
    pass