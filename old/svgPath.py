import re
import json
import codecs

d={}
with open('C:/Users/77777/Desktop/PingFangHeiTiJiXi/基本汉字(4E00-9FA5).svg',mode='r') as fr:
    for line in fr:
        name = re.search('glyph-name="uni(.{4})"\s+unicode',line).group(1)
        path = re.search('d="(.*)"\s+horiz',line).group(1)
        name = '\\u'+name
        name = codecs.decode(name,'unicode_escape')
        d[name] = path

with open('4E00-9FA5.json',mode='w') as fw:
    jsonStr = json.dumps(d)
    fw.write(jsonStr)