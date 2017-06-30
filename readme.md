DanmukuCourse Serverside 说明

----------

# 一、Http协议

## 0、代码表

| code | message         | 备注                     |
| ---- | --------------- | ---------------------- |
| 2000 | 登陆成功！           |                        |
| 2001 | 创建成功！           | 弹幕房间创建成功               |
| 2002 | 修改成功！           | 弹幕房间修改成功               |
| 2003 | 获取教师所拥有房间成功     |                        |
| 2004 | 注册成功！           |                        |
| 2005 | 删除成功！           | 弹幕房间删除成功               |
| 2006 | 获取该弹幕房所有签到记录成功！ |                        |
| 4000 | 认证信息错误          | 给予了错误的teacherid和secret |
| 4001 | 找不到该教师          | 登录使用的sid没有被注册过         |
| 4002 | 教师工号密码不匹配       |                        |
| 4003 | 弹幕房间信息不完整       | 缺少title或containers     |
| 4004 | 缺少房间id信息        | 缺少roomid               |
| 4005 | 没有对该房间访问的权限     | 给予的room和teacher没有所属关系  |
| 4006 | 房间已被删除          |                        |
| 4007 | 需要授权访问          | teacherid和secret信息不完整  |

## 1、教师登录

`post` `/teachers/login`

发送

```json
{
  "sid": "10000",
  "password": "94165b0be8a06b797a6da9274afb827fc7b3eee83d45f10f17c81309992090ea"
}
```

注，密码在客户端发送之前使用`sha-256`算法进行摘要处理。测试用的密码的明文是`zhmoll`。

返回

```json
{
  "code": 2000,
  "message": "登陆成功！",
  "body": {
    "teacherid": "这里是教师的数据库id",
    "rooms": [{
      "id": "弹幕房间id",
  	  "title": "弹幕房间名",
      "containers": ["14051534","14051533","14051532"]
    }],
    "secret": "操作密钥"
  }
}
```

## 2、创建弹幕房间

`post` `/teachers/rooms?teacherid=5955db1323738d22f8778092&secret=3da449f20c780866dd84ca7be66ddbc103faf1dd55e771af41b0237527590631`

路由中，教师id和密钥需要正确填写

发送

```json
{
  "title": "2018年春季数据结构课堂",
  "containers": ["14051534","14051309","14051238"]
}
```

返回

```json
{
  "code": 2001,
  "message": "创建成功！",
  "body": {
    "title": "2018年春季数据结构课堂",
    "roomid": "123123123",
    "containers": ["14051534","14051309","14051238"]
  }
}
```

## 3、修改弹幕房间

`put` `/teachers/rooms?teacherid=5955db1323738d22f8778092&secret=3da449f20c780866dd84ca7be66ddbc103faf1dd55e771af41b0237527590631&roomid=5955db7223738d22f8778093`

路由中，roomid填写选择要修改的房间的id，教师id和密钥需要正确填写

发送

```json
{
  "title": "2018年春季数据结构课堂",
  "containers": ["14051534","14051533","14051532"]
}
```

返回

```json
{
  "code": 2002,
  "message": "修改成功！",
  "body": {
    "title": "2018年春季数据结构课堂",
    "roomid": "123123123",
    "containers": ["14051534","14051533","14051532"]
  }
}
```

## 4、获取所有弹幕房间

`get` `/teachers/rooms?teacherid=5955db1323738d22f8778092&secret=3da449f20c780866dd84ca7be66ddbc103faf1dd55e771af41b0237527590631`

返回

```json
{
    "code": 2003,
    "message": "获取教师所拥有房间成功",
    "body": {
        "rooms": [
            {
                "roomid": "5955db7223738d22f8778093",
                "title": "2018年春季数据结构课堂",
                "containers": [
                    "14051534",
                    "14051309",
                    "14051238"
                ]
            }
        ]
    }
}
```

## 5、教师注册

`post` `/teachers/reg`

发送

```json
{
  "sid": "工号",
  "password": "94165b0be8a06b797a6da9274afb827fc7b3eee83d45f10f17c81309992090ea"
}
```

返回

```json
{
  "code": 2004,
  "message": "注册成功"
}
```

## 6、教师获得签到表

`get` `/teachers/rooms/signins?teacherid=5955db1323738d22f8778092&secret=3da449f20c780866dd84ca7be66ddbc103faf1dd55e771af41b0237527590631&roomid=5955db7223738d22f8778093`

返回

```json
{
    "code": 2006,
    "message": "获取该弹幕房所有签到记录成功！",
    "body": {
        "table": [
            [
                "学号",
                "2017-06-30 14:41:13",
                "2017-06-30 15:56:54"
            ],
            [
                "14051238",
                "×",
                "×"
            ],
            [
                "14051309",
                "×",
                "×"
            ],
            [
                "14051534",
                "√",
                "√"
            ]
        ]
    }
}
```

在table中，除第一行每一行都是一个学生在所有次签到的记录。具体是什么样子可以访问下一个接口预览。

## 7、教师下载签到表

`get` `/teachers/rooms/signins/download?teacherid=5955db1323738d22f8778092&secret=3da449f20c780866dd84ca7be66ddbc103faf1dd55e771af41b0237527590631&roomid=5955db7223738d22f8778093`

浏览器访问，弹出下载文件。

## 8、删除弹幕房间

`delete` `/teachers/rooms?teacherid=5955db1323738d22f8778092&secret=3da449f20c780866dd84ca7be66ddbc103faf1dd55e771af41b0237527590631&roomid=5955db7223738d22f8778093`

返回

```json
{
    "code": 2005,
    "message": "删除成功！"
}
```

# 二、WebSocket协议

## 1、建立ws连接

请求 ws://domain/danmuku?teacherid=123123&secret=123123&roomid=123123

其中上面的三个参数均由前一个接口登录后获得。

测试用 ws://45.76.156.38:8080/?teacherid=5953636f1df92707286c9fb5&secret=123&roomid=595362d61df92707286c9fb2

## 2、ws连接通信协议统一格式

```json
{
  "type": "消息类型",
  "body": {}
}
```

## 3、签到

客户端发送，发起签到命令

```json
{
  "type": "signin",
  "body": {}
}
```

客户端发送，结束签到命令

```json
{
  "type": "signin_end",
  "body": {}
}
```

服务器发送，签到心跳包，需由客户端处理

```json
{
  "type": "signin_code",
  "body": {
     "key": "ddbbb1e9bc1f78b590c4200f67718c7b06f0c620266ee4d272fcba6cbd4506a4",
     "count": 25,
  }
}
```

需要将`key`转化为二维码显示，而`count`则为成功签到人数。

## 4、服务端通知消息

```json
{
  "type": "info",
  "body": {
     "message": "来自服务器的信息"
  }
}
```

## 5、弹幕消息

服务端转发送的学生弹幕信息

```json
{
  "type": "danmuku",
  "body": {
     "uid": "学号",
     "name": "姓名",
     "content": "内容"
  }
}
```
