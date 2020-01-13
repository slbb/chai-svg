import re
from typing import *
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

class Curve(object):
    def __init__(self,start:Point,end:Point)->None:
        self.start=start
        self.end=end

class CurveL(Curve):
    def __init__(self, start:Point, end:Point):
        super().__init__(start, end)
    def __str__(self):
        return 'L{0}{1}'.format(self.start.__str__(),self.end.__str__())

class CurveQ(Curve):
    def __init__(self, start:Point, end:Point,control:Point):
        super().__init__(start, end)
        self.control=control
    def __str__(self):
        return 'Q{0}{1}{2}'.format(self.start.__str__(),self.end.__str__(),self.control.__str__())

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
    nowPoint=Point(0,0)
    curves:List[Curve]=[]
    first = re.split('(?<=\d)\s*(?=[A-Za-z])',path.strip())
    for item in first:
        typeName,paramsStr=re.split('(?<=[A-Za-z])',item)
        if paramsStr:
            paramsList=paramsStrToParamsList(paramsStr)
        if typeName.lower()=='m':
            end=Point(paramsList[0],paramsList[1])
            if typeName.islower():
                end.offset(nowPoint.x,nowPoint.y)
            nowPoint=end
        elif typeName.lower()=='l':
            end=Point(paramsList[0],paramsList[1])
            if typeName.islower():
                end.offset(nowPoint.x,nowPoint,y)
            curves.append(CurveL(nowPoint,end))
            nowPoint=end
        elif typeName.lower()=='h':
            end=Point(paramsList[0],nowPoint.y)
            if typeName.islower():
                end.offset(nowPoint.x,0)
            curves.append(CurveL(nowPoint,end))
            nowPoint=end
        elif typeName.lower()=='v':
            end=Point(nowPoint.x,paramsList[0])
            if typeName.islower():
                end.offset(0,nowPoint.y)
            curves.append(CurveL(nowPoint.end))
            nowPoint=end
        elif typeName.lower()=='q':
            end=Point(paramsList[0],paramsList[1])
            control=Point(paramsList[2],paramsList[3])
            if typeName.islower():
                end.offset(nowPoint.x,nowPoint.y)
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

            pass
    return curves

