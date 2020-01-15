import re
from typing import *
import abc
Num = TypeVar('Num',int,float)
class Point:
    def __init__(self,x:Num,y:Num)->None:
        self.x=x
        self.y=y
    def offset(self,x:Num,y:Num)->None:
        self.x=self.x+x
        self.y=self.y+y
    def __str__(self):
        return '({0},{1})'.format(self.x,self.y)
    def isSamePosition(self,p:Point)->bool:
        return self.x == p.x and self.y == p.y

class Curve(object):
    def __init__(self,start:Point,end:Point)->None:
        self.start=start
        self.end=end
    @abc.abstractmethod
    def isIntersect(self,y:Num)->bool:
        pass

class CurveL(Curve):
    def __init__(self, start:Point, end:Point):
        super().__init__(start, end)
        self.a=start.x-end.x
        self.b=start.y-end.y
        self.c=-self.a*start.x-self.b*start.y
    def __str__(self):
        return 'L{0}{1}'.format(self.start.__str__(),self.end.__str__())
    def isIntersect(self,y:Num)->bool:
        if self.a==0:
            return False
        elif self.b==0:
            return self.start.y<y<self.end.y or self.end.y<y<self.end.y
        else:
            x= (-self.c-self.b*y)/self.a
            return self.start.x<x<self.end.x or self.end.x<x<self.start.x

class CurveQ(Curve):
    def __init__(self, start:Point, end:Point,control:Point):
        super().__init__(start, end)
        self.control=control
    def __str__(self):
        return 'Q{0}{1}{2}'.format(self.start.__str__(),self.end.__str__(),self.control.__str__())
    def isIntersect(self, y:Num)->bool:
        pass

def isPointInsideClosedCurve(p:Point,closedCurve:List[Curve])->bool:
    count=0
    for c in closedCurve:
        if c.isIntersect(p.y):
            count+=1
    return count%2==1


def pathToCurveList(path:str)->List[Curve]:
    def stringToNum(s:str) -> Num:
        """字符转数字"""
        if '.' in s:
            return float(s)
        else:
            return int(s)
    def paramsStrToParamsList(paramsStr:str)->List[Num]:
        paramsList=[]
        for item in re.split('[,\s]+|(?<=\d)(?=-)',paramsStr.strip()):
            paramsList.append(stringToNum(item))
        return paramsList
    headPoint=None
    nowPoint=Point(0,0)
    curves=[]
    first = re.split('(?<=\d)\s*(?=[A-Za-z])',path.strip())
    for item in first:
        typeName,paramsStr=re.split('(?<=[A-Za-z])',item)
        if paramsStr:
            paramsList=paramsStrToParamsList(paramsStr)
        if typeName.lower()=='m':
            end=Point(paramsList[0],paramsList[1])
            if typeName.islower():
                end.offset(nowPoint.x,nowPoint.y)
            headPoint=end
            nowPoint=end
        elif typeName.lower()=='l':
            end=Point(paramsList[0],paramsList[1])
            if typeName.islower():
                end.offset(nowPoint.x,nowPoint.y)
            if end.isSamePosition(headPoint):
                end=headPoint
                headPoint=None
            curves.append(CurveL(nowPoint,end))
            nowPoint=end
        elif typeName.lower()=='h':
            end=Point(paramsList[0],nowPoint.y)
            if typeName.islower():
                end.offset(nowPoint.x,0)
            if end.isSamePosition(headPoint):
                end=headPoint
                headPoint=None
            curves.append(CurveL(nowPoint,end))
            nowPoint=end
        elif typeName.lower()=='v':
            end=Point(nowPoint.x,paramsList[0])
            if typeName.islower():
                end.offset(0,nowPoint.y)
            if end.isSamePosition(headPoint):
                end=headPoint
                headPoint=None
            curves.append(CurveL(nowPoint,end))
            nowPoint=end
        elif typeName.lower()=='q':
            end=Point(paramsList[0],paramsList[1])
            control=Point(paramsList[2],paramsList[3])
            if typeName.islower():
                end.offset(nowPoint.x,nowPoint.y)
                control.offset(nowPoint.x,nowPoint.y)
            if end.isSamePosition(headPoint):
                end=headPoint
                headPoint=None
            curves.append(CurveQ(nowPoint,end,control))
            nowPoint=end
        elif typeName.lower()=='t':
            pass
        elif typeName.lower()=='c':
            pass
        elif typeName.lower()=='s':
            pass
        elif typeName.lower()=='a':
            pass
        elif typeName.lower()=='z':
            if headPoint:
                if not (headPoint.x=nowPoint.x and headPoint.y=nowPoint.y):
                    curves.append(CurveL(nowPoint,headPoint))
                nowPoint=headPoint
            pass
    return curves

def divideClosedCurves(curves:Sequence[Curve])->List[List[Curve]]:
    headPoint=None
    character=[]
    closedCurve=[]
    for c in curves:
        if not headPoint:
            headPoint=c.start
            closedCurve.append(c)
            continue
        if not c.end.isSamePosition(headPoint):
            closedCurve.append(c)
        else:
            character.append(closedCurve.append(c))
            closedCurve=[]
            headPoint=None
    return character

def generateCharaterPart(character:Sequence[Sequence[Curve]])->List[List[Curve]]:
    for closedCurve in character:
        